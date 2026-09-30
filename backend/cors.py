"""Which browser origins may call this API.

Two mechanisms, because they answer different questions.

CORS_ORIGINS is the explicit list: localhost in development, the production
frontend in production. Exact strings, no guessing.

Vercel gives every preview deployment its own hostname, so those cannot be
listed ahead of time. Rather than falling back to a wildcard — which would
let any site on the internet call the API from a logged-in browser — previews
are matched by a regex anchored to one project and one account, built from
VERCEL_PROJECT and VERCEL_SCOPE. Both must be set for the regex to exist at
all; a half-configured deployment gets no preview access instead of a loose
pattern.

Note that allow_credentials is on, which is exactly why a wildcard is not an
option here: browsers refuse `*` with credentials, and the combination is the
one CORS most wants to prevent.
"""

import os
import re

DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"


def allowed_origins() -> list[str]:
    """The exact origins from CORS_ORIGINS, or the localhost pair."""
    raw = os.getenv("CORS_ORIGINS")
    if raw is None or not raw.strip():
        raw = DEFAULT_ORIGINS
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


def preview_origin_regex() -> str | None:
    """A regex matching this project's Vercel preview deployments, or None.

    Vercel preview hostnames look like:
        https://<project>-<hash>-<scope>.vercel.app
        https://<project>-git-<branch>-<scope>.vercel.app

    Both project and scope are required. Anchored at both ends so a hostname
    that merely contains the project name — say
    https://evil-noteai-web-attacker.vercel.app — does not match.
    """
    project = (os.getenv("VERCEL_PROJECT") or "").strip()
    scope = (os.getenv("VERCEL_SCOPE") or "").strip()
    if not project or not scope:
        return None

    return (
        rf"^https://{re.escape(project)}-[a-z0-9]+(?:-[a-z0-9]+)*-{re.escape(scope)}\.vercel\.app$"
    )
