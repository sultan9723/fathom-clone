"""AI Q&A over a meeting transcript.

Provider is auto-detected: GROQ_API_KEY first (fast, free tier), then
ANTHROPIC_API_KEY (SPEC.md's original target), then OPENAI_API_KEY. With none
configured — or if the call fails for any reason — the endpoint degrades
gracefully instead of returning a 5xx.
"""

import logging
import os
from typing import Callable

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from routes.meetings import get_meeting_or_404

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

NO_KEY_MESSAGE = "API key not configured"
NO_KEY_TRANSLATE_MESSAGE = "Translation not configured. Add API key to use."
MAX_CONTEXT_CHARS = 60_000
# A transcript is translated in one call; 4096 output tokens is the ceiling
# (the brief's 500 truncates anything past a few short lines).
TRANSLATE_MAX_TOKENS = 4096
TRANSLATE_MAX_CHARS = 20_000
# Values that look like a key but aren't one — treated as "not configured"
# rather than sent to a provider to earn a 401.
PLACEHOLDER_KEYS = {"sk-test", "your-api-key-here", "changeme"}

TRANSLATE_SYSTEM_PROMPT = (
    "You are a translator. Return only the translated text — no preamble, no notes, "
    "no quotes around it. Preserve speaker names, numbers and formatting."
)

SYSTEM_PROMPT = (
    "You answer questions about a recorded meeting using only the meeting metadata and "
    "transcript provided by the user. If the transcript does not contain the answer, say so "
    "plainly. Keep answers concise and cite speaker names and timestamps where helpful."
)


def _format_timestamp(seconds: int) -> str:
    minutes, secs = divmod(max(seconds or 0, 0), 60)
    return f"{minutes:02d}:{secs:02d}"


def _build_prompt(meeting: models.Meeting, transcripts: list[models.Transcript], question: str) -> str:
    lines = [
        f"Meeting title: {meeting.title}",
        f"Description: {meeting.description or '(none)'}",
        f"Languages: {meeting.languages or '(unknown)'}",
        f"Speakers: {meeting.speaker_count}",
        f"Duration: {_format_timestamp(meeting.duration_seconds)}",
        "",
        "Transcript:",
    ]
    if transcripts:
        for line in transcripts:
            speaker = line.speaker_name or "Unknown"
            lines.append(f"[{_format_timestamp(line.timestamp_seconds)}] {speaker}: {line.text}")
    else:
        lines.append("(no transcript lines recorded)")

    context = "\n".join(lines)
    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + "\n[transcript truncated]"

    return f"{context}\n\nQuestion: {question}"


def _anthropic(system: str, prompt: str, max_tokens: int) -> str:
    import anthropic

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    message = client.beta.messages.create(
        model="claude-opus-5",
        max_tokens=max_tokens,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    if message.stop_reason == "refusal":
        return "The model declined to answer this question."
    text = "\n".join(block.text for block in message.content if block.type == "text").strip()
    return text or "The model returned an empty response."


def _openai(system: str, prompt: str, max_tokens: int) -> str:
    from openai import OpenAI

    client = OpenAI()  # reads OPENAI_API_KEY
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )
    text = (completion.choices[0].message.content or "").strip()
    return text or "The model returned an empty response."


def _groq(system: str, prompt: str, max_tokens: int) -> str:
    from groq import Groq

    client = Groq()  # reads GROQ_API_KEY
    completion = client.chat.completions.create(
        # mixtral-8x7b-32768 is decommissioned on Groq's platform as of this
        # writing (confirmed live: their API returns 400 "has been
        # decommissioned" for it) — openai/gpt-oss-120b is Groq's current
        # equivalent-tier model and is confirmed working against this key.
        model="openai/gpt-oss-120b",
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )
    text = (completion.choices[0].message.content or "").strip()
    return text or "The model returned an empty response."


def _resolve_provider() -> Callable[[str, str, int], str] | None:
    """
    Pick the client that matches the key that is actually set — never hand one
    provider's key to the other's SDK. A placeholder key counts as unconfigured.
    Groq is checked first: it's the fast/free option, and preferring it over
    Anthropic when both are configured is the point of adding it.
    """
    if _is_real_key(os.getenv("GROQ_API_KEY")):
        return _groq
    if _is_real_key(os.getenv("ANTHROPIC_API_KEY")):
        return _anthropic
    if _is_real_key(os.getenv("OPENAI_API_KEY")):
        return _openai
    return None


def _is_real_key(value: str | None) -> bool:
    return bool(value) and value.strip() not in PLACEHOLDER_KEYS


@router.post("/ask", response_model=schemas.AskResponse)
def ask(payload: schemas.AskRequest, db: Session = Depends(get_db)) -> schemas.AskResponse:
    meeting = get_meeting_or_404(db, payload.meeting_id)

    provider = _resolve_provider()
    if provider is None:
        return schemas.AskResponse(response=NO_KEY_MESSAGE)

    stmt = (
        select(models.Transcript)
        .where(models.Transcript.meeting_id == meeting.id)
        .order_by(models.Transcript.timestamp_seconds.asc())
    )
    transcripts = list(db.scalars(stmt).all())
    prompt = _build_prompt(meeting, transcripts, payload.question)

    try:
        return schemas.AskResponse(response=provider(SYSTEM_PROMPT, prompt, 4096))
    except ImportError:
        return schemas.AskResponse(
            response="AI unavailable: provider SDK is not installed (pip install -r requirements.txt)"
        )
    except Exception as exc:  # never fail the request because the AI provider is unhappy
        return schemas.AskResponse(response=f"AI unavailable: {type(exc).__name__}: {exc}")


@router.post("/translate", response_model=schemas.TranslateResponse)
def translate(payload: schemas.TranslateRequest) -> schemas.TranslateResponse:
    """
    Translate a block of text between languages.

    Sync, not async: the provider SDKs block, which would stall the event loop
    inside an async handler. FastAPI runs this in its threadpool instead.

    Like /ask, this never returns a 5xx because the AI is unhappy — the failure
    rides back in `translated` so the UI can show a notice. The exception is
    logged server-side; only its type reaches the client, since provider errors
    quote the API key back at you.
    """
    text = payload.text.strip()
    if len(text) > TRANSLATE_MAX_CHARS:
        text = text[:TRANSLATE_MAX_CHARS] + "\n[text truncated]"

    def reply(translated: str) -> schemas.TranslateResponse:
        return schemas.TranslateResponse(
            original=payload.text,
            translated=translated,
            source_lang=payload.source_lang,
            target_lang=payload.target_lang,
        )

    provider = _resolve_provider()
    if provider is None:
        return reply(NO_KEY_TRANSLATE_MESSAGE)

    prompt = (
        f"Translate the following {payload.source_lang} text into {payload.target_lang}.\n\n{text}"
    )

    try:
        return reply(provider(TRANSLATE_SYSTEM_PROMPT, prompt, TRANSLATE_MAX_TOKENS))
    except ImportError:
        return reply(
            "Translation unavailable: provider SDK is not installed "
            "(pip install -r requirements.txt)"
        )
    except Exception as exc:
        logger.exception("Translation failed (%s -> %s)", payload.source_lang, payload.target_lang)
        return reply(f"Translation unavailable: {type(exc).__name__}")
