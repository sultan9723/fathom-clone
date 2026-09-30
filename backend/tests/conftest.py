"""Test fixtures for the NoteAI backend.

Everything here runs against a dedicated database (noteai_test by default),
never the development one. The guard in _require_separate_database() makes
that structural rather than a matter of remembering: the suite refuses to run
if DATABASE_URL still points at the dev database or at a non-local host.

database.py builds its engine at import time from DATABASE_URL, so the
environment has to be set before anything imports it. conftest.py is loaded
before the test modules, and load_dotenv() inside database.py does not
override a variable that is already set, so the assignment below wins over
backend/.env.
"""

import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

DEV_DATABASE = "noteai"
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql://noteai:devpass@localhost:5432/noteai_test"
)
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


def _require_separate_database(url: str) -> None:
    parts = urlsplit(url)
    name = parts.path.lstrip("/")
    if (parts.hostname or "").lower() not in LOCAL_HOSTS:
        raise RuntimeError(f"Test database must be local, got host {parts.hostname!r}")
    if name == DEV_DATABASE:
        raise RuntimeError(
            f"Refusing to run tests against the development database {name!r}. "
            "Set TEST_DATABASE_URL to a separate database."
        )
    if not name:
        raise RuntimeError(f"No database name in TEST_DATABASE_URL: {url!r}")


_require_separate_database(TEST_DATABASE_URL)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL


def _create_database_if_missing(url: str) -> None:
    """CREATE DATABASE needs a connection to some other database on the server."""
    import psycopg2
    from psycopg2 import sql

    parts = urlsplit(url)
    name = parts.path.lstrip("/")
    admin_url = urlunsplit(parts._replace(path="/postgres"))

    conn = psycopg2.connect(admin_url)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (name,))
            if cur.fetchone() is None:
                cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
    finally:
        conn.close()


@pytest.fixture(scope="session", autouse=True)
def database():
    """Create the test database and its schema once for the whole run."""
    _create_database_if_missing(TEST_DATABASE_URL)

    import models  # noqa: F401  (registers every table on Base)
    from database import Base, engine

    assert str(engine.url).startswith("postgresql"), engine.url
    assert engine.url.database != DEV_DATABASE

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables(database):
    """Every test starts from empty tables, so ordering can't leak state."""
    import models
    from database import SessionLocal

    session = SessionLocal()
    try:
        for model in (
            models.ProviderUsage,
            models.TranscriptTranslation,
            models.Note,
            models.ActionItem,
            models.Transcript,
            models.Meeting,
        ):
            session.query(model).delete()
        session.commit()
    finally:
        session.close()
    yield


@pytest.fixture
def db():
    """A session for the test to use; closed afterwards."""
    from database import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
