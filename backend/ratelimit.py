"""Per-IP rate limiting for the endpoints that cost money.

Only the AI routes are limited. Reading meetings and transcripts hits the
database and is cheap; /ai/ask, /ai/translate and the batch translation route
each spend a provider call, so an open deployment without limits is a billing
hole.

This drives the `limits` library directly — the same engine slowapi wraps —
as an ASGI middleware rather than using slowapi's decorators. Two reasons:
the decorators require every limited route to take a `request: Request`
parameter, which would break the tests that call those handlers directly
(TestClient is unusable here: installed httpx 0.28 dropped the `app=`
shortcut starlette 0.27 needs), and per-path limits are clearer expressed in
one table than spread across decorators.

Storage is in-process. On a single instance that is exactly right; across
several it limits per instance, which is a looser bound than it appears —
noted rather than hidden. The daily budget in budget.py is the backstop that
is shared, because it lives in the database.
"""

import os
import re
import time

from limits import RateLimitItem, parse
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

# Defaults are deliberately generous for a person and tight for a script.
DEFAULT_AI_LIMIT = "20/minute"
DEFAULT_TRANSLATIONS_LIMIT = "10/minute"

TOO_MANY_REQUESTS = (
    "Too many requests. You have reached the limit for AI requests — "
    "please wait a moment and try again."
)


def _rule(env_var: str, fallback: str) -> RateLimitItem:
    """Parse a limit like '20/minute' from the environment.

    A malformed value falls back rather than crashing the app at import: a
    typo in a dashboard variable should not take the whole service down, and
    the fallback is still a limit.
    """
    raw = (os.getenv(env_var) or "").strip()
    if not raw:
        return parse(fallback)
    try:
        return parse(raw)
    except ValueError:
        return parse(fallback)


def limited_routes() -> list[tuple[str, re.Pattern[str], RateLimitItem]]:
    """(bucket name, path pattern, limit), most specific first.

    The bucket name — not the raw path — is what the limit is keyed on. The
    translations path carries a meeting id, so keying on the path would give
    every meeting its own allowance and let a caller rotate ids to spend the
    provider budget without ever tripping the limit.
    """
    ai = _rule("RATE_LIMIT_AI", DEFAULT_AI_LIMIT)
    translations = _rule("RATE_LIMIT_TRANSLATIONS", DEFAULT_TRANSLATIONS_LIMIT)
    return [
        ("ai", re.compile(r"^/api/v1/ai/(ask|translate)/?$"), ai),
        ("translations", re.compile(r"^/api/v1/meetings/[^/]+/translations/?$"), translations),
    ]


def client_ip(request: Request) -> str:
    """The caller's address, honouring one proxy hop.

    Render and Vercel both terminate TLS in front of the app, so
    request.client.host is the proxy. X-Forwarded-For's first entry is the
    original client. This trusts that header, which is only safe because the
    service is expected to sit behind exactly such a proxy; exposed directly,
    the header is caller-controlled and the limit becomes advisory.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rejects a caller that exceeds the limit for one of the AI routes."""

    def __init__(self, app, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled
        self.limiter = FixedWindowRateLimiter(MemoryStorage())
        self.routes = limited_routes()

    def _match(self, path: str) -> tuple[str, RateLimitItem] | None:
        for name, pattern, rule in self.routes:
            if pattern.match(path):
                return name, rule
        return None

    async def dispatch(self, request: Request, call_next):
        matched = self._match(request.url.path) if self.enabled else None
        if matched is None:
            return await call_next(request)

        bucket, rule = matched
        # Keyed by bucket as well as caller, so exhausting the translation
        # allowance doesn't also lock someone out of asking a question.
        key = f"{bucket}:{client_ip(request)}"
        if not self.limiter.hit(rule, key):
            reset_at, _ = self.limiter.get_window_stats(rule, key)
            retry_after = max(1, int(reset_at - time.time()))
            return JSONResponse(
                status_code=429,
                content={"detail": TOO_MANY_REQUESTS},
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
