"""AI Q&A over a meeting transcript.

Provider is auto-detected: ANTHROPIC_API_KEY first (SPEC.md targets the Claude API),
then OPENAI_API_KEY. With neither configured — or if the call fails for any reason —
the endpoint degrades gracefully instead of returning a 5xx.
"""

import os

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from routes.meetings import get_meeting_or_404

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

NO_KEY_MESSAGE = "API key not configured"
MAX_CONTEXT_CHARS = 60_000

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


def _ask_anthropic(prompt: str) -> str:
    import anthropic

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    message = client.beta.messages.create(
        model="claude-opus-5",
        max_tokens=4096,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    if message.stop_reason == "refusal":
        return "The model declined to answer this question."
    text = "\n".join(block.text for block in message.content if block.type == "text").strip()
    return text or "The model returned an empty response."


def _ask_openai(prompt: str) -> str:
    from openai import OpenAI

    client = OpenAI()  # reads OPENAI_API_KEY
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    text = (completion.choices[0].message.content or "").strip()
    return text or "The model returned an empty response."


@router.post("/ask", response_model=schemas.AskResponse)
def ask(payload: schemas.AskRequest, db: Session = Depends(get_db)) -> schemas.AskResponse:
    meeting = get_meeting_or_404(db, payload.meeting_id)

    if os.getenv("ANTHROPIC_API_KEY"):
        provider = _ask_anthropic
    elif os.getenv("OPENAI_API_KEY"):
        provider = _ask_openai
    else:
        return schemas.AskResponse(response=NO_KEY_MESSAGE)

    stmt = (
        select(models.Transcript)
        .where(models.Transcript.meeting_id == meeting.id)
        .order_by(models.Transcript.timestamp_seconds.asc())
    )
    transcripts = list(db.scalars(stmt).all())
    prompt = _build_prompt(meeting, transcripts, payload.question)

    try:
        return schemas.AskResponse(response=provider(prompt))
    except ImportError:
        return schemas.AskResponse(
            response="AI unavailable: provider SDK is not installed (pip install -r requirements.txt)"
        )
    except Exception as exc:  # never fail the request because the AI provider is unhappy
        return schemas.AskResponse(response=f"AI unavailable: {type(exc).__name__}: {exc}")
