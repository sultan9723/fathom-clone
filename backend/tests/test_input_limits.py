"""Caller-supplied text is capped, and oversized input is refused.

The handlers are called directly — HTTPException carries the same status and
detail the HTTP layer returns, and TestClient is unusable on httpx 0.28.
"""

import pytest
from fastapi import HTTPException

import models
import schemas
from routes import ai


@pytest.fixture
def meeting(db):
    meeting = models.Meeting(title="Budget review", speaker_count=1, duration_seconds=60)
    db.add(meeting)
    db.commit()
    return meeting


@pytest.fixture
def no_provider(monkeypatch):
    """Nothing here should ever reach a provider."""
    calls: list[str] = []

    def explode(*args, **kwargs):
        calls.append("called")
        raise AssertionError("the provider must not be reached for oversized input")

    monkeypatch.setattr(ai, "_resolve_provider", lambda: explode)
    return calls


# --- /ai/ask -----------------------------------------------------------------

def test_an_oversized_question_is_rejected_with_413(db, meeting, no_provider, monkeypatch):
    monkeypatch.setenv("MAX_QUESTION_CHARS", "100")

    with pytest.raises(HTTPException) as raised:
        ai.ask(schemas.AskRequest(meeting_id=meeting.id, question="x" * 101), db=db)

    assert raised.value.status_code == 413
    assert "too long" in raised.value.detail.lower()
    assert no_provider == [], "rejection must happen before any provider call"


def test_the_message_names_both_the_size_and_the_limit(db, meeting, monkeypatch):
    monkeypatch.setenv("MAX_QUESTION_CHARS", "100")

    with pytest.raises(HTTPException) as raised:
        ai.ask(schemas.AskRequest(meeting_id=meeting.id, question="x" * 250), db=db)

    assert "250" in raised.value.detail
    assert "100" in raised.value.detail


def test_a_question_at_the_limit_is_accepted(db, meeting, monkeypatch):
    monkeypatch.setenv("MAX_QUESTION_CHARS", "50")
    # No provider configured, so this returns the not-configured notice rather
    # than raising — which is the point: the cap did not reject it.
    monkeypatch.setattr(ai, "_resolve_provider", lambda: None)

    result = ai.ask(schemas.AskRequest(meeting_id=meeting.id, question="x" * 50), db=db)

    assert result.response == ai.NO_KEY_MESSAGE


def test_the_question_cap_is_checked_before_the_meeting_is_looked_up(db, monkeypatch):
    """An oversized question to an unknown meeting is 413, not 404 — the cheap
    check runs first so a flood of huge payloads never reaches the database."""
    monkeypatch.setenv("MAX_QUESTION_CHARS", "10")

    with pytest.raises(HTTPException) as raised:
        ai.ask(
            schemas.AskRequest(meeting_id="00000000-0000-0000-0000-000000000000", question="x" * 99),
            db=db,
        )

    assert raised.value.status_code == 413


# --- /ai/translate -----------------------------------------------------------

def test_oversized_text_is_rejected_rather_than_truncated(db, no_provider, monkeypatch):
    """Previously this silently translated the first 20,000 characters.

    Returning a translation of part of the text without saying so is worse
    than refusing it.
    """
    monkeypatch.setenv("MAX_TRANSLATE_CHARS", "200")

    with pytest.raises(HTTPException) as raised:
        ai.translate(
            schemas.TranslateRequest(text="x" * 201, source_lang="en", target_lang="ur"),
            db=db,
        )

    assert raised.value.status_code == 413
    assert no_provider == []


def test_text_within_the_cap_is_accepted(db, monkeypatch):
    monkeypatch.setenv("MAX_TRANSLATE_CHARS", "200")
    monkeypatch.setattr(ai, "_resolve_provider", lambda: None)

    result = ai.translate(
        schemas.TranslateRequest(text="x" * 200, source_lang="en", target_lang="ur"),
        db=db,
    )

    assert result.translated == ai.NO_KEY_TRANSLATE_MESSAGE


# --- Configuration -----------------------------------------------------------

def test_caps_come_from_the_environment(monkeypatch):
    monkeypatch.setenv("MAX_QUESTION_CHARS", "42")
    monkeypatch.setenv("MAX_TRANSLATE_CHARS", "4321")

    assert ai.max_question_chars() == 42
    assert ai.max_translate_chars() == 4321


def test_unset_caps_use_the_defaults(monkeypatch):
    monkeypatch.delenv("MAX_QUESTION_CHARS", raising=False)
    monkeypatch.delenv("MAX_TRANSLATE_CHARS", raising=False)

    assert ai.max_question_chars() == ai.DEFAULT_MAX_QUESTION_CHARS
    assert ai.max_translate_chars() == ai.DEFAULT_MAX_TRANSLATE_CHARS


@pytest.mark.parametrize("bad", ["not-a-number", "0", "-5", "   "])
def test_an_unusable_cap_falls_back_to_the_default(monkeypatch, bad):
    # A zero or negative cap would reject every request; a typo should not
    # take the endpoint down either.
    monkeypatch.setenv("MAX_QUESTION_CHARS", bad)

    assert ai.max_question_chars() == ai.DEFAULT_MAX_QUESTION_CHARS


def test_the_assembled_transcript_context_is_truncated_not_rejected():
    """The prompt context is ours, not the caller's.

    A genuinely long meeting is legitimate input, so the transcript we build
    is capped by truncation — refusing it would make long meetings unusable.
    """
    meeting = models.Meeting(title="Long one", speaker_count=1, duration_seconds=10_000)
    lines = [
        models.Transcript(meeting_id="m", text="word " * 200, timestamp_seconds=i, speaker_name="A")
        for i in range(400)
    ]

    prompt = ai._build_prompt(meeting, lines, "What happened?")

    assert "[transcript truncated]" in prompt
    assert prompt.endswith("Question: What happened?")


# --- Secrets never escape ----------------------------------------------------

class LeakyProvider:
    """A provider whose error quotes the API key back, as real ones do."""

    MESSAGE = "401 Unauthorized: invalid api key gsk_liveSECRETkey123 for openai/gpt-oss-120b"

    def __call__(self, system, prompt, max_tokens):
        raise RuntimeError(self.MESSAGE)


def test_ask_never_returns_the_provider_error_text(db, meeting, monkeypatch, caplog):
    monkeypatch.setattr(ai, "_resolve_provider", lambda: LeakyProvider())

    with caplog.at_level("DEBUG"):
        result = ai.ask(
            schemas.AskRequest(meeting_id=meeting.id, question="What happened?"), db=db
        )

    # The response is rendered straight into the UI.
    assert "gsk_liveSECRETkey123" not in result.response
    assert LeakyProvider.MESSAGE not in result.response
    assert result.response == "AI unavailable: RuntimeError"

    logged = caplog.text
    assert "gsk_liveSECRETkey123" not in logged
    assert LeakyProvider.MESSAGE not in logged


def test_translate_never_returns_or_logs_the_provider_error_text(db, monkeypatch, caplog):
    monkeypatch.setattr(ai, "_resolve_provider", lambda: LeakyProvider())

    with caplog.at_level("DEBUG"):
        result = ai.translate(
            schemas.TranslateRequest(text="hello", source_lang="en", target_lang="es"),
            db=db,
        )

    assert "gsk_liveSECRETkey123" not in result.translated
    assert result.translated == "Translation unavailable: RuntimeError"
    assert "gsk_liveSECRETkey123" not in caplog.text
