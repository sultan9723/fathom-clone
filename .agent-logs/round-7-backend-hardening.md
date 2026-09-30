# NoteAI Round 7 — Backend hardening: limits, budget, CORS

## Session
- Date: 2026-09-30
- Branch: `v2-integrate`. Backend only; no frontend source changed.
- Local Docker Postgres (dev + `noteai_test`). No production access.

## 1. Per-IP rate limiting — `c5633e5`
`backend/ratelimit.py`. `/ai/ask`, `/ai/translate` and
`/meetings/{id}/translations` each spend a provider call and were all
unauthenticated and unthrottled. Reading meetings stays unlimited — it only
touches the database.

Limits from `RATE_LIMIT_AI` (default 20/minute) and
`RATE_LIMIT_TRANSLATIONS` (10/minute); `RATE_LIMIT_ENABLED` switches it off.
A malformed value falls back rather than crashing at import; the flag is off
only when explicitly false, so a missing variable never silently removes the
limit. Over the limit: **429** with a plain-language detail and `Retry-After`.

Built on `limits` — the engine slowapi wraps — as middleware rather than
slowapi's decorators. Those require every limited route to take
`request: Request`, which would break the 16 translation tests that call the
handlers directly, and `TestClient` is unavailable to convert them (httpx
0.28 dropped the `app=` shortcut starlette 0.27 needs).

Two decisions worth naming:
- The key is the **matched route**, not the request path. The translations
  path carries a meeting id, so keying on the path would give every meeting
  its own allowance and let a caller rotate ids to spend the budget freely.
- The middleware is registered **before** CORS so it runs **after** it —
  Starlette applies middleware in reverse — otherwise the browser sees an
  opaque network error instead of the 429.

Storage is in-process, so across instances this limits per instance. That is
looser than it looks; the daily budget is the shared backstop.

14 tests through the real ASGI stack via `httpx.ASGITransport`.

## 2. Input caps — `08a3407`
`/ai/ask` accepted a question of any length; `/ai/translate` **silently
truncated** at 20,000 characters, returning a translation of part of the
input without saying so. Both now reject with **413**, naming the size
received and the limit. `MAX_QUESTION_CHARS` (2,000) and
`MAX_TRANSLATE_CHARS` (20,000); unparseable, zero or negative falls back —
a zero cap would refuse everything.

The question cap runs before the meeting lookup and before any provider
call, so huge payloads never reach the database or spend money.
`MAX_CONTEXT_CHARS` still truncates, and the distinction is now written
down: the assembled prompt is ours, not the caller's, and a genuinely long
meeting is legitimate.

13 tests.

## 3. Daily provider budget — `2637200`
`backend/budget.py` + `provider_usage` table. Rate limiting bounds one
caller; it does nothing about many callers or rotating addresses. Once
`GROQ_DAILY_CALL_BUDGET` calls have been made in a UTC day, no provider call
is made by anyone until rollover. Exceeded: **503**, which the frontend
already renders as its translation fallback ("Showing the original for now"
+ Retry), so no UI change was needed. 503 not 429 — the caller did nothing
wrong and waiting a minute will not help.

The counter is a **table**, not a process variable: an in-memory counter
resets on every restart (Render restarts freely) and counts separately per
instance, so the thing meant to cap total spend would be neither durable nor
global.

Claiming a call is one conditional upsert, so two concurrent requests cannot
both take the last one — the write locks the row and the loser's `WHERE`
matches nothing. Check-then-increment would have that race.

Budget is spent only when a call is genuinely about to happen: cache hits,
unsupported languages, oversized questions and an unconfigured provider all
return without touching it, each covered by a test. A budget that drained on
cache hits would be worse than none.

18 tests.

## 4. CORS — `22fbe7b`
`backend/cors.py`. Explicit origins from `CORS_ORIGINS`, trimmed of
whitespace and trailing slashes (a trailing slash never matches — browsers
send the origin without one). Vercel previews get a new hostname per deploy,
so they are matched by a regex built from `VERCEL_PROJECT` and
`VERCEL_SCOPE`, anchored at both ends with both values escaped. **No
wildcard**: `allow_credentials` is on, and that combination is the one CORS
exists to prevent.

Both variables must be set or no regex is produced — a half-configured
deployment gets no preview access rather than a loose pattern.

18 tests, mostly negative: another account, another project, the name
embedded in a longer hostname, a lookalike domain, plain http, a trailing
path, a half-configured pair, a dot in the project name. Verified end to end
through the real app: a matching preview preflight is allowed, another
account's is refused.

## 5. Secrets never escape — `e197d8b`
Found while auditing for the "never log API keys or full provider errors"
requirement. `/ai/ask` was returning the **full exception text** to the
caller:

    response=f"AI unavailable: {type(exc).__name__}: {exc}"

That string renders straight into the Ask panel, and a real provider 401
quotes the failing key. Only the exception type is returned now.

The logging had the same problem: `logger.exception()` writes the traceback,
and the traceback carries the provider's message. Three call sites now log
the exception type via `logger.error()`. The one exception value still
logged is our own `ValueError` from `_parse_batch_response`, constructed
locally.

Four tests use a provider whose error embeds a realistic key and assert it
appears in neither the response, the `HTTPException` detail, nor anything at
DEBUG level in `caplog`.

## Configuration
`render.yaml` and `backend/.env.example` document every new variable.
`backend/.env` remains gitignored; `.env.example` remains committable.

## Verification
- `pytest` — **95 passed** (was 29).
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 59 passed, 8 files.
- `npx next build` — compiled successfully.

## Open
- Rate-limit storage is per instance. A shared store (Redis) would make it
  global; the daily budget already is, so the ceiling on spend holds either
  way.
- `provider_usage` is a new table, so `create_all` will add it on next boot.
  There is still no Alembic, so the next change to an **existing** table will
  not apply — unchanged from the Round 5 audit.
- `client_ip` trusts `X-Forwarded-For`, which is correct behind Render or
  Vercel and advisory if the service is ever exposed directly.
