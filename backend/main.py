"""NoteAI backend — FastAPI application entrypoint."""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import cors
import models  # noqa: F401  (imported so create_all sees every table)
from database import Base, SessionLocal, engine
from ratelimit import RateLimitMiddleware
from routes import ai, health, meetings, transcripts, translations
from seed import seed_if_empty

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
# Off only when explicitly disabled, so a missing variable never silently
# removes the limit.
RATE_LIMIT_ENABLED = (os.getenv("RATE_LIMIT_ENABLED", "true").strip().lower()
                      not in {"false", "0", "no", "off"})
CORS_ORIGINS = cors.allowed_origins()
# Vercel preview deployments get a new hostname each time, so they are matched
# by a regex scoped to this project rather than by a wildcard. None when the
# project and scope are not both configured.
CORS_PREVIEW_REGEX = cors.preview_origin_regex()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP: create tables on startup (no Alembic yet).
    Base.metadata.create_all(bind=engine)
    # Render's disk isn't persistent across deploys, so a fresh DB needs
    # seed data every time. Known legacy demos are repaired in place; user
    # meetings are preserved by exact metadata and transcript fingerprints.
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="NoteAI API",
    description="Multilingual meeting assistant backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Added before CORS so it runs after it: Starlette applies middleware in
# reverse order, and a rejected caller should still receive CORS headers or
# the browser reports an opaque network error instead of the 429.
app.add_middleware(RateLimitMiddleware, enabled=RATE_LIMIT_ENABLED)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_PREVIEW_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(meetings.router)
app.include_router(meetings.search_router)
app.include_router(transcripts.router)
app.include_router(ai.router)
app.include_router(translations.router)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {
        "service": "NoteAI API",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=ENVIRONMENT == "development",
    )
