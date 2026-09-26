"""NoteAI backend — FastAPI application entrypoint."""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401  (imported so create_all sees every table)
from database import Base, SessionLocal, engine
from routes import ai, health, meetings, transcripts
from seed import seed_if_empty

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP: create tables on startup (no Alembic yet).
    Base.metadata.create_all(bind=engine)
    # Render's disk isn't persistent across deploys, so a fresh DB needs
    # seed data every time — seed_if_empty() is a no-op once it's populated.
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(meetings.router)
app.include_router(meetings.search_router)
app.include_router(transcripts.router)
app.include_router(ai.router)


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
