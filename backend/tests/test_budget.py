"""The global daily provider budget.

Rate limiting bounds one caller; this bounds total spend. Once the day's
budget is gone, nobody's request reaches a provider until the date rolls
over.
"""

import pytest
from fastapi import HTTPException

import budget
import models
import schemas
from routes import ai, translations


@pytest.fixture
def meeting_with_transcript(db):
    meeting = models.Meeting(title="Budget test", speaker_count=1, duration_seconds=120)
    db.add(meeting)
    db.flush()
    db.add(
        models.Transcript(
            meeting_id=meeting.id,
            text="Only line.",
            timestamp_seconds=0,
            speaker_name="A",
            original_language="en",
        )
    )
    db.commit()
    return meeting


class CountingProvider:
    def __init__(self, reply="1. traducido"):
        self.reply = reply
        self.calls = 0

    def __call__(self, system, prompt, max_tokens):
        self.calls += 1
        return self.reply


# --- Reserving ---------------------------------------------------------------

def test_calls_are_counted_against_the_day(db, monkeypatch):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "5")

    assert budget.calls_used(db) == 0
    assert budget.reserve_provider_call(db) == 1
    assert budget.reserve_provider_call(db) == 2
    assert budget.calls_used(db) == 2


def test_the_budget_stops_further_calls_with_503(db, monkeypatch):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "2")
    budget.reserve_provider_call(db)
    budget.reserve_provider_call(db)

    with pytest.raises(HTTPException) as raised:
        budget.reserve_provider_call(db)

    assert raised.value.status_code == 503
    assert "daily limit" in raised.value.detail.lower()


def test_a_rejected_reservation_does_not_inflate_the_count(db, monkeypatch):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "1")
    budget.reserve_provider_call(db)

    for _ in range(3):
        with pytest.raises(HTTPException):
            budget.reserve_provider_call(db)

    # Still exactly the one call that was actually allowed.
    assert budget.calls_used(db) == 1


def test_a_budget_of_zero_allows_nothing(db, monkeypatch):
    # 0 is honoured rather than treated as unset: it is a deliberate way to
    # switch spending off.
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "0")

    with pytest.raises(HTTPException) as raised:
        budget.reserve_provider_call(db)

    assert raised.value.status_code == 503
    assert budget.calls_used(db) == 0


def test_yesterdays_usage_does_not_count_against_today(db, monkeypatch):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "1")
    db.execute(
        models.ProviderUsage.__table__.insert().values(day="2020-01-01", calls=999)
    )
    db.commit()

    # The counter is keyed by day, so an exhausted past day is irrelevant.
    assert budget.reserve_provider_call(db) == 1


# --- Configuration -----------------------------------------------------------

def test_the_budget_comes_from_the_environment(monkeypatch):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "37")
    assert budget.daily_budget() == 37


def test_an_unset_budget_uses_the_default(monkeypatch):
    monkeypatch.delenv("GROQ_DAILY_CALL_BUDGET", raising=False)
    assert budget.daily_budget() == budget.DEFAULT_DAILY_BUDGET


@pytest.mark.parametrize("bad", ["lots", "-1", "   "])
def test_an_unusable_budget_falls_back_to_the_default(monkeypatch, bad):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", bad)
    assert budget.daily_budget() == budget.DEFAULT_DAILY_BUDGET


def test_days_are_counted_in_utc(monkeypatch):
    # Not the server's local date, or the rollover would move with the host.
    from datetime import datetime, timezone

    assert budget.today() == datetime.now(timezone.utc).strftime("%Y-%m-%d")


# --- The endpoints honour it -------------------------------------------------

def test_batch_translation_returns_503_once_the_budget_is_gone(
    db, meeting_with_transcript, monkeypatch
):
    provider = CountingProvider()
    monkeypatch.setattr(translations, "_resolve_provider", lambda: provider)
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "1")
    budget.reserve_provider_call(db)  # spend the day's only call

    with pytest.raises(HTTPException) as raised:
        translations.translate_meeting(meeting_id=meeting_with_transcript.id, lang="es", db=db)

    assert raised.value.status_code == 503
    assert provider.calls == 0, "no provider call may be made once the budget is gone"


def test_a_cache_hit_does_not_spend_budget(db, meeting_with_transcript, monkeypatch):
    provider = CountingProvider()
    monkeypatch.setattr(translations, "_resolve_provider", lambda: provider)
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "10")

    translations.translate_meeting(meeting_id=meeting_with_transcript.id, lang="es", db=db)
    after_first = budget.calls_used(db)
    translations.translate_meeting(meeting_id=meeting_with_transcript.id, lang="es", db=db)

    assert after_first == 1
    assert budget.calls_used(db) == 1, "the cached request must not spend budget"
    assert provider.calls == 1


def test_an_unsupported_language_does_not_spend_budget(
    db, meeting_with_transcript, monkeypatch
):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "10")

    with pytest.raises(HTTPException):
        translations.translate_meeting(
            meeting_id=meeting_with_transcript.id, lang="klingon", db=db
        )

    assert budget.calls_used(db) == 0


def test_ask_returns_503_once_the_budget_is_gone(db, meeting_with_transcript, monkeypatch):
    provider = CountingProvider(reply="an answer")
    monkeypatch.setattr(ai, "_resolve_provider", lambda: provider)
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "1")
    budget.reserve_provider_call(db)

    with pytest.raises(HTTPException) as raised:
        ai.ask(
            schemas.AskRequest(meeting_id=meeting_with_transcript.id, question="What?"),
            db=db,
        )

    assert raised.value.status_code == 503
    assert provider.calls == 0


def test_ask_without_a_provider_does_not_spend_budget(db, meeting_with_transcript, monkeypatch):
    monkeypatch.setattr(ai, "_resolve_provider", lambda: None)
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "10")

    ai.ask(
        schemas.AskRequest(meeting_id=meeting_with_transcript.id, question="What?"), db=db
    )

    assert budget.calls_used(db) == 0


def test_translate_returns_503_once_the_budget_is_gone(db, monkeypatch):
    provider = CountingProvider(reply="traducido")
    monkeypatch.setattr(ai, "_resolve_provider", lambda: provider)
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "1")
    budget.reserve_provider_call(db)

    with pytest.raises(HTTPException) as raised:
        ai.translate(
            schemas.TranslateRequest(text="hello", source_lang="en", target_lang="es"),
            db=db,
        )

    assert raised.value.status_code == 503
    assert provider.calls == 0


def test_the_503_message_never_leaks_configuration(db, monkeypatch):
    monkeypatch.setenv("GROQ_DAILY_CALL_BUDGET", "0")
    monkeypatch.setenv("GROQ_API_KEY", "gsk_supersecretvalue")

    with pytest.raises(HTTPException) as raised:
        budget.reserve_provider_call(db)

    detail = raised.value.detail
    assert "gsk_" not in detail
    assert "GROQ_DAILY_CALL_BUDGET" not in detail
