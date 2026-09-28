"""Batch transcript translation: cache miss, cache hit, and provider failure.

These call the route function directly rather than through TestClient. The
installed httpx (0.28) dropped the `app=` shortcut that starlette 0.27's
TestClient relies on, and pinning it down would mean changing a package in the
shared environment. Calling the handler loses nothing that matters here:
HTTPException carries the same status_code and detail the HTTP layer would
return, so the contract is asserted either way, and
test_route_is_registered covers the wiring.

The provider is always stubbed — these tests must never spend a real Groq
call, and must be able to assert how many calls were made, which is the whole
point of the cache.
"""

import pytest
from fastapi import HTTPException

import models
from routes import translations


@pytest.fixture
def meeting(db):
    """A meeting with three transcript lines."""
    meeting = models.Meeting(
        title="Product Atlas Kickoff", speaker_count=2, duration_seconds=600
    )
    db.add(meeting)
    db.flush()
    for seconds, speaker, text in [
        (0, "Sofia", "This is the kickoff for Atlas."),
        (35, "Ben", "Phase one is read-only maps."),
        (80, "Nina", "I want the map full-bleed on mobile."),
    ]:
        db.add(
            models.Transcript(
                meeting_id=meeting.id,
                text=text,
                timestamp_seconds=seconds,
                speaker_name=speaker,
                original_language="en",
            )
        )
    db.commit()
    return meeting


class FakeProvider:
    """Stands in for the Groq call, counting invocations."""

    def __init__(self, reply=None, error=None):
        self.reply = reply
        self.error = error
        self.calls = 0
        self.prompts: list[str] = []

    def __call__(self, system, prompt, max_tokens):
        self.calls += 1
        self.prompts.append(prompt)
        if self.error is not None:
            raise self.error
        return self.reply


def numbered(*texts):
    return "\n".join(f"{i}. {t}" for i, t in enumerate(texts, start=1))


@pytest.fixture
def use_provider(monkeypatch):
    def install(provider):
        monkeypatch.setattr(translations, "_resolve_provider", lambda: provider)
        return provider

    return install


def translate(meeting_id, lang, db):
    return translations.translate_meeting(meeting_id=meeting_id, lang=lang, db=db)


# --- Cache miss -------------------------------------------------------------

def test_first_request_calls_the_provider_once_and_caches(db, meeting, use_provider):
    provider = use_provider(
        FakeProvider(numbered("یہ اٹلس کا آغاز ہے۔", "پہلا مرحلہ نقشے ہیں۔", "میں چاہتی ہوں۔"))
    )

    result = translate(meeting.id, "ur", db)

    assert result.lang == "ur"
    assert result.cached is False
    assert [line.text for line in result.lines] == [
        "یہ اٹلس کا آغاز ہے۔",
        "پہلا مرحلہ نقشے ہیں۔",
        "میں چاہتی ہوں۔",
    ]
    # One call for the whole transcript, not one per line.
    assert provider.calls == 1
    assert db.query(models.TranscriptTranslation).count() == 3


def test_translations_are_returned_in_transcript_order(db, meeting, use_provider):
    use_provider(FakeProvider(numbered("one", "two", "three")))

    result = translate(meeting.id, "es", db)

    ordered_ids = [
        line.id
        for line in db.query(models.Transcript)
        .filter_by(meeting_id=meeting.id)
        .order_by(models.Transcript.timestamp_seconds.asc())
        .all()
    ]
    assert [line.line_id for line in result.lines] == ordered_ids


# --- Cache hit --------------------------------------------------------------

def test_second_request_is_served_from_cache_without_calling_the_provider(
    db, meeting, use_provider
):
    provider = use_provider(FakeProvider(numbered("uno", "dos", "tres")))

    first = translate(meeting.id, "es", db)
    second = translate(meeting.id, "es", db)

    assert first.cached is False
    assert second.cached is True
    assert [l.text for l in second.lines] == [l.text for l in first.lines]
    assert provider.calls == 1, "the cached request must not reach the provider"
    assert db.query(models.TranscriptTranslation).count() == 3


def test_a_different_language_is_a_separate_cache_entry(db, meeting, use_provider):
    provider = use_provider(FakeProvider(numbered("a", "b", "c")))

    translate(meeting.id, "es", db)
    translate(meeting.id, "ur", db)

    assert provider.calls == 2
    assert db.query(models.TranscriptTranslation).count() == 6


def test_only_uncached_lines_are_sent_to_the_provider(db, meeting, use_provider):
    """A line added after the first translation is the only one re-translated."""
    use_provider(FakeProvider(numbered("uno", "dos", "tres")))
    translate(meeting.id, "es", db)

    db.add(
        models.Transcript(
            meeting_id=meeting.id,
            text="A late addition.",
            timestamp_seconds=120,
            speaker_name="Sofia",
            original_language="en",
        )
    )
    db.commit()

    provider = use_provider(FakeProvider(numbered("cuatro")))
    result = translate(meeting.id, "es", db)

    assert provider.calls == 1
    assert "A late addition." in provider.prompts[0]
    assert "This is the kickoff" not in provider.prompts[0]
    assert [line.text for line in result.lines] == ["uno", "dos", "tres", "cuatro"]


# --- Failure ----------------------------------------------------------------

def test_provider_failure_returns_502_and_caches_nothing(db, meeting, use_provider):
    use_provider(FakeProvider(error=RuntimeError("groq exploded")))

    with pytest.raises(HTTPException) as raised:
        translate(meeting.id, "ur", db)

    assert raised.value.status_code == 502
    assert "try again" in raised.value.detail.lower()
    assert db.query(models.TranscriptTranslation).count() == 0


def test_failure_detail_never_leaks_the_provider_error(db, meeting, use_provider):
    use_provider(FakeProvider(error=RuntimeError("Invalid api key sk-secret-12345")))

    with pytest.raises(HTTPException) as raised:
        translate(meeting.id, "ur", db)

    assert "sk-secret-12345" not in raised.value.detail
    assert "RuntimeError" not in raised.value.detail


def test_incomplete_reply_is_a_failure_not_a_partial_translation(db, meeting, use_provider):
    # Two lines back for three sent: attaching these to the wrong lines would
    # be worse than showing the original.
    use_provider(FakeProvider(numbered("uno", "dos")))

    with pytest.raises(HTTPException) as raised:
        translate(meeting.id, "es", db)

    assert raised.value.status_code == 502
    assert "incomplete" in raised.value.detail.lower()
    assert db.query(models.TranscriptTranslation).count() == 0


def test_unconfigured_provider_returns_503(db, meeting, use_provider):
    use_provider(None)

    with pytest.raises(HTTPException) as raised:
        translate(meeting.id, "ur", db)

    assert raised.value.status_code == 503
    assert "not configured" in raised.value.detail.lower()


def test_a_failed_language_can_be_retried_successfully(db, meeting, use_provider):
    use_provider(FakeProvider(error=RuntimeError("transient")))
    with pytest.raises(HTTPException):
        translate(meeting.id, "es", db)

    use_provider(FakeProvider(numbered("uno", "dos", "tres")))
    retry = translate(meeting.id, "es", db)

    assert [line.text for line in retry.lines] == ["uno", "dos", "tres"]
    assert db.query(models.TranscriptTranslation).count() == 3


# --- Validation -------------------------------------------------------------

def test_unsupported_language_is_rejected_before_any_provider_call(
    db, meeting, use_provider
):
    provider = use_provider(FakeProvider(numbered("x", "y", "z")))

    with pytest.raises(HTTPException) as raised:
        translate(meeting.id, "klingon", db)

    assert raised.value.status_code == 400
    assert provider.calls == 0


def test_unknown_meeting_is_404(db, use_provider):
    use_provider(FakeProvider(numbered("x")))

    with pytest.raises(HTTPException) as raised:
        translate("00000000-0000-0000-0000-000000000000", "ur", db)

    assert raised.value.status_code == 404


def test_meeting_with_no_transcript_returns_an_empty_cached_result(db, use_provider):
    provider = use_provider(FakeProvider(numbered("x")))
    empty = models.Meeting(title="Empty", speaker_count=0, duration_seconds=0)
    db.add(empty)
    db.commit()

    result = translate(empty.id, "ur", db)

    assert result.lines == []
    assert result.cached is True
    assert provider.calls == 0


# --- Wiring and parsing -----------------------------------------------------

def test_route_is_registered_on_the_app():
    from main import app

    routes = {
        (route.path, method)
        for route in app.routes
        for method in getattr(route, "methods", set())
    }
    assert ("/api/v1/meetings/{meeting_id}/translations", "POST") in routes


def test_parser_reattaches_wrapped_continuation_lines():
    parsed = translations._parse_batch_response("1. first part\ncontinued here\n2. second", 2)
    assert parsed == ["first part continued here", "second"]


def test_parser_rejects_a_reply_missing_a_line():
    with pytest.raises(ValueError, match="2 of 3"):
        translations._parse_batch_response("1. one\n3. three", 3)
