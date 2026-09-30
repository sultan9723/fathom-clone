# NoteAI Round 8 — render.yaml only

## Session
- Date: 2026-09-30
- Branch: `v2-integrate`. Only `render.yaml` changed (plus this log).
- Target services, already deployed: `noteai-backend` (Python 3, Frankfurt)
  and `noteai-db` (PostgreSQL 18, Frankfurt, holds production data).

## State on arrival
Two of the four requested fixes were already done on this branch, in
`f76f92a` and `49d91d9` from earlier rounds:
- `rootDir: backend` was present, and `startCommand` already ran `main:app`
  rather than `backend.main:app`.
- The `DATABASE_URL: sqlite:///./noteai.db` literal and the
  `ANTHROPIC_API_KEY: sk-test` placeholder were already gone.

So this round's real work was the proxy flags, `RATE_LIMIT_ENABLED`, and
removing the literal values that were still hardcoded for three of the
variables the dashboard should own.

## Changes

**startCommand**

before: `uvicorn main:app --host 0.0.0.0 --port $PORT`
after:  `uvicorn main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips='*'`

Quoted as a YAML string so the single quotes reach the shell, which strips
them before uvicorn sees the argument. Verified the parsed value is exactly
the intended command.

**DATABASE_URL** — unchanged this round; already `sync: false` with no
literal. It stays a Render environment variable on `noteai-backend`,
pointing at the existing `noteai-db`. Nothing in this file touches the
database service: there is deliberately no `databases:` block, because a
Blueprint that declares one can recreate it.

**Env vars now listed without values.** `RATE_LIMIT_ENABLED` was missing
entirely and is added. `RATE_LIMIT_AI`, `RATE_LIMIT_TRANSLATIONS`,
`GROQ_DAILY_CALL_BUDGET`, `MAX_QUESTION_CHARS` and `MAX_TRANSLATE_CHARS`
carried literal values and now use `sync: false`, so a deploy can never
quietly overwrite what is configured in the dashboard. `ENVIRONMENT:
production` is the only remaining literal — it is a deploy-time fact about
this file, not a tunable.

Full list, all `sync: false`: `DATABASE_URL`, `GROQ_API_KEY`,
`CORS_ORIGINS`, `VERCEL_PROJECT`, `VERCEL_SCOPE`, `RATE_LIMIT_ENABLED`,
`RATE_LIMIT_AI`, `RATE_LIMIT_TRANSLATIONS`, `GROQ_DAILY_CALL_BUDGET`,
`MAX_QUESTION_CHARS`, `MAX_TRANSLATE_CHARS`.

## Verification
Ran the exact startCommand from `backend/` against local Postgres:

    cd backend
    export PORT=8123 DATABASE_URL=postgresql://noteai:devpass@localhost:5432/noteai
    uvicorn main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips='*'

Application startup completed and `/api/v1/health` returned 200. With
`RATE_LIMIT_AI=2/minute`, a third request from `203.0.113.7` returned 429
with `retry-after: 58` and the expected detail, while a first request from
`198.51.100.4` still passed — per-IP bucketing working through the real
server.

A first attempt failed with "Invalid value for '--port': '--proxy-headers'
is not a valid integer". That was my test invocation, not the command:
`PORT=8123 uvicorn ... --port $PORT` expands `$PORT` from the *current*
environment before the inline assignment applies, so it expanded to nothing.
Render sets `PORT` in the environment before running startCommand, so the
command as written is correct; the local test needed `export`.

## Correction to the stated premise
The task asked me to confirm `--proxy-headers` is present "since
ratelimit.py's client_ip depends on it". The flag is now present, but that
dependency does not hold as stated, and I checked rather than assumed.

`client_ip()` reads the `X-Forwarded-For` header directly
(`request.headers.get("x-forwarded-for")`); it does not read
`request.client.host` unless the header is absent. `--proxy-headers` is what
makes uvicorn rewrite `request.client.host` from that header — a different
path.

Running the same server **without** `--proxy-headers` and the same
2/minute limit produced identical results: 404, 404, 429 for one forwarded
IP and 404 for a second. Rate limiting is unaffected by the flag.

The flag is still worth keeping, for reasons other than the limiter:
`request.client.host` becomes the real client for anything that logs or
inspects it later, and `X-Forwarded-Proto` gives the app the correct https
scheme behind Render's TLS termination.

## Not changed, deliberately
`region: frankfurt` and a `databases:` block would make the file describe
more of the deployed topology, but both touch deployment identity on
services that already exist and hold production data. Out of scope for
"fix render.yaml only", and not worth the risk without a reason to.
