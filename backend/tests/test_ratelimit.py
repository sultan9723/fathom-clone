"""Per-IP rate limiting on the AI endpoints.

Driven through the real ASGI stack with httpx.ASGITransport rather than
TestClient, which is unusable here (httpx 0.28 dropped the `app=` shortcut
starlette 0.27 relies on). The middleware only exists in the stack, so
testing it any other way would prove nothing.

A throwaway Starlette app stands in for the real routes: what is under test
is the middleware's matching, keying and response, not the handlers.
"""

import httpx
import pytest
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.requests import Request as StarletteRequest

import ratelimit


def build_app(monkeypatch, *, enabled=True, ai=None, translations=None):
    """A minimal app carrying the limited paths plus one unlimited path."""
    for name, value in (
        ("RATE_LIMIT_AI", ai),
        ("RATE_LIMIT_TRANSLATIONS", translations),
    ):
        if value is None:
            monkeypatch.delenv(name, raising=False)
        else:
            monkeypatch.setenv(name, value)

    async def ok(request):
        return JSONResponse({"ok": True})

    app = Starlette(
        routes=[
            Route("/api/v1/ai/ask", ok, methods=["POST"]),
            Route("/api/v1/ai/translate", ok, methods=["POST"]),
            Route("/api/v1/meetings/{meeting_id}/translations", ok, methods=["POST"]),
            Route("/api/v1/meetings", ok, methods=["GET"]),
            Route("/api/v1/health", ok, methods=["GET"]),
        ]
    )
    app.add_middleware(ratelimit.RateLimitMiddleware, enabled=enabled)
    return app


def client(app):
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://t")


def ip(address: str) -> dict[str, str]:
    return {"x-forwarded-for": address}


# --- The limit itself --------------------------------------------------------

@pytest.mark.asyncio
async def test_requests_within_the_limit_are_allowed(monkeypatch):
    app = build_app(monkeypatch, ai="3/minute")
    async with client(app) as http:
        for _ in range(3):
            assert (await http.post("/api/v1/ai/ask", headers=ip("1.1.1.1"))).status_code == 200


@pytest.mark.asyncio
async def test_exceeding_the_limit_returns_429_with_a_clear_message(monkeypatch):
    app = build_app(monkeypatch, ai="2/minute")
    async with client(app) as http:
        for _ in range(2):
            await http.post("/api/v1/ai/ask", headers=ip("2.2.2.2"))
        response = await http.post("/api/v1/ai/ask", headers=ip("2.2.2.2"))

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert "too many requests" in detail.lower()
    assert "try again" in detail.lower()


@pytest.mark.asyncio
async def test_429_carries_a_retry_after_header(monkeypatch):
    app = build_app(monkeypatch, ai="1/minute")
    async with client(app) as http:
        await http.post("/api/v1/ai/ask", headers=ip("3.3.3.3"))
        response = await http.post("/api/v1/ai/ask", headers=ip("3.3.3.3"))

    assert response.status_code == 429
    assert 0 < int(response.headers["retry-after"]) <= 60


# --- Keying ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_each_ip_gets_its_own_allowance(monkeypatch):
    app = build_app(monkeypatch, ai="1/minute")
    async with client(app) as http:
        assert (await http.post("/api/v1/ai/ask", headers=ip("4.4.4.4"))).status_code == 200
        # A different caller is unaffected by the first one's usage.
        assert (await http.post("/api/v1/ai/ask", headers=ip("5.5.5.5"))).status_code == 200
        assert (await http.post("/api/v1/ai/ask", headers=ip("4.4.4.4"))).status_code == 429


@pytest.mark.asyncio
async def test_ask_and_translations_have_separate_allowances(monkeypatch):
    app = build_app(monkeypatch, ai="1/minute", translations="1/minute")
    async with client(app) as http:
        assert (await http.post("/api/v1/ai/ask", headers=ip("6.6.6.6"))).status_code == 200
        assert (await http.post("/api/v1/ai/ask", headers=ip("6.6.6.6"))).status_code == 429
        # Exhausting /ask must not lock the same caller out of translating.
        translations = await http.post("/api/v1/meetings/m1/translations", headers=ip("6.6.6.6"))
        assert translations.status_code == 200


@pytest.mark.asyncio
async def test_rotating_the_meeting_id_does_not_reset_the_translations_limit(monkeypatch):
    """The limit is keyed on the route, not the path."""
    app = build_app(monkeypatch, translations="2/minute")
    async with client(app) as http:
        assert (await http.post("/api/v1/meetings/aaa/translations", headers=ip("7.7.7.7"))).status_code == 200
        assert (await http.post("/api/v1/meetings/bbb/translations", headers=ip("7.7.7.7"))).status_code == 200
        response = await http.post("/api/v1/meetings/ccc/translations", headers=ip("7.7.7.7"))

    assert response.status_code == 429


@pytest.mark.asyncio
async def test_ask_and_translate_share_the_ai_allowance(monkeypatch):
    app = build_app(monkeypatch, ai="2/minute")
    async with client(app) as http:
        assert (await http.post("/api/v1/ai/ask", headers=ip("8.8.8.8"))).status_code == 200
        assert (await http.post("/api/v1/ai/translate", headers=ip("8.8.8.8"))).status_code == 200
        response = await http.post("/api/v1/ai/translate", headers=ip("8.8.8.8"))

    assert response.status_code == 429


# --- Scope -------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cheap_database_routes_are_not_limited(monkeypatch):
    app = build_app(monkeypatch, ai="1/minute")
    async with client(app) as http:
        for _ in range(10):
            assert (await http.get("/api/v1/meetings", headers=ip("9.9.9.9"))).status_code == 200
            assert (await http.get("/api/v1/health", headers=ip("9.9.9.9"))).status_code == 200


@pytest.mark.asyncio
async def test_limiting_can_be_disabled(monkeypatch):
    app = build_app(monkeypatch, enabled=False, ai="1/minute")
    async with client(app) as http:
        for _ in range(5):
            assert (await http.post("/api/v1/ai/ask", headers=ip("10.10.10.10"))).status_code == 200


# --- Configuration -----------------------------------------------------------

def test_limits_come_from_the_environment(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_AI", "7/minute")
    monkeypatch.setenv("RATE_LIMIT_TRANSLATIONS", "3/hour")
    routes = dict((name, rule) for name, _, rule in ratelimit.limited_routes())

    assert routes["ai"].amount == 7
    assert routes["translations"].amount == 3


def test_a_malformed_limit_falls_back_instead_of_crashing(monkeypatch):
    # A typo in a dashboard variable must not take the service down, and the
    # fallback is still a limit.
    monkeypatch.setenv("RATE_LIMIT_AI", "not-a-limit")
    routes = dict((name, rule) for name, _, rule in ratelimit.limited_routes())

    assert str(routes["ai"]) == str(ratelimit.parse(ratelimit.DEFAULT_AI_LIMIT))


def test_an_unset_limit_uses_the_default(monkeypatch):
    monkeypatch.delenv("RATE_LIMIT_AI", raising=False)
    routes = dict((name, rule) for name, _, rule in ratelimit.limited_routes())

    assert str(routes["ai"]) == str(ratelimit.parse(ratelimit.DEFAULT_AI_LIMIT))


# --- Caller identification ---------------------------------------------------

def test_client_ip_prefers_the_first_forwarded_address():
    """Behind a proxy the socket address is the proxy, not the caller."""
    scope = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"1.2.3.4, 10.0.0.1")],
        "client": ("10.0.0.1", 1234),
    }
    assert ratelimit.client_ip(StarletteRequest(scope)) == "1.2.3.4"


def test_client_ip_falls_back_to_the_socket_address():
    scope = {"type": "http", "headers": [], "client": ("203.0.113.9", 1234)}
    assert ratelimit.client_ip(StarletteRequest(scope)) == "203.0.113.9"
