"""A global daily ceiling on provider calls.

Per-IP rate limiting (ratelimit.py) bounds one caller; it does nothing about
a thousand callers, or one caller behind rotating addresses. This is the
backstop on total spend: once the day's budget is gone, no provider call is
made by anyone until the date rolls over.

The counter lives in the database rather than in process memory on purpose.
An in-memory counter resets on every deploy and every restart — Render
restarts freely — and counts separately in each instance, so the thing meant
to cap total spend would be neither durable nor global. A table is both.

Days are counted in UTC so the rollover does not move with the server's
timezone.
"""

import logging
import os
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

DEFAULT_DAILY_BUDGET = 1_000

# 503 rather than 429: the caller did nothing wrong and waiting a minute will
# not help. The frontend already renders this as its translation fallback —
# "Showing the original for now" with a Retry.
BUDGET_EXHAUSTED = (
    "The daily limit for AI requests has been reached. "
    "Translations and summaries will be available again tomorrow."
)


def daily_budget() -> int:
    """Calls allowed per UTC day, from GROQ_DAILY_CALL_BUDGET.

    An unparseable value falls back to the default rather than crashing. A
    value of 0 is honoured as "no calls today" — that is a deliberate way to
    switch spending off, not a mistake to paper over. Negative values are
    treated as unusable and fall back.
    """
    raw = (os.getenv("GROQ_DAILY_CALL_BUDGET") or "").strip()
    if not raw:
        return DEFAULT_DAILY_BUDGET
    try:
        value = int(raw)
    except ValueError:
        return DEFAULT_DAILY_BUDGET
    return value if value >= 0 else DEFAULT_DAILY_BUDGET


def today() -> str:
    """The current UTC date as YYYY-MM-DD."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def calls_used(db: Session, day: str | None = None) -> int:
    """How many calls have been counted for a day. Zero if none yet."""
    row = db.execute(
        text("SELECT calls FROM provider_usage WHERE day = :day"),
        {"day": day or today()},
    ).first()
    return int(row[0]) if row else 0


def reserve_provider_call(db: Session) -> int:
    """Claim one call against today's budget, or raise 503.

    The claim is a single conditional upsert, so two requests arriving at once
    cannot both take the last call: the row is locked by the write, and the
    WHERE clause means the second one updates nothing and comes back empty.
    Checking and then incrementing in two statements would have that race.

    Returns the running total for the day, which the caller may log.
    """
    budget = daily_budget()
    if budget <= 0:
        raise HTTPException(status_code=503, detail=BUDGET_EXHAUSTED)

    row = db.execute(
        text(
            """
            INSERT INTO provider_usage (day, calls) VALUES (:day, 1)
            ON CONFLICT (day) DO UPDATE
                SET calls = provider_usage.calls + 1
                WHERE provider_usage.calls < :budget
            RETURNING calls
            """
        ),
        {"day": today(), "budget": budget},
    ).first()

    if row is None:
        # The conflicting row existed and was already at the budget.
        db.rollback()
        logger.warning("Daily provider budget of %s calls is exhausted", budget)
        raise HTTPException(status_code=503, detail=BUDGET_EXHAUSTED)

    db.commit()
    return int(row[0])
