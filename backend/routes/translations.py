"""Batch translation of a meeting's transcript, cached per line and language.

Translating a transcript line by line would mean one provider call per line
and no memory between page loads. This route translates every uncached line
of a meeting in a single call and stores the results, so the second request
for a language is a database read.

It differs from /api/v1/ai/translate deliberately: that endpoint degrades to
HTTP 200 with the failure in the body, because it renders inline. This one
returns a real error status, because the UI needs to tell a failure apart
from a translation and offer a retry.
"""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import budget
import models
import schemas
from database import get_db
from routes.ai import TRANSLATE_MAX_TOKENS, _resolve_provider
from routes.meetings import get_meeting_or_404

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/meetings", tags=["translations"])

# Languages the UI offers. Anything else is rejected rather than sent to the
# provider, so a typo cannot spend a call and poison the cache under a key
# nothing will ever read back.
SUPPORTED_LANGS = {"en", "ur", "zh", "es", "ar", "fr", "de", "ja"}

LANGUAGE_NAMES = {
    "en": "English",
    "ur": "Urdu",
    "zh": "Simplified Chinese",
    "es": "Spanish",
    "ar": "Arabic",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
}

BATCH_SYSTEM_PROMPT = (
    "You are a translator. You will be given numbered lines of a meeting transcript. "
    "Translate each line into the requested language. Return exactly one line per input, "
    "each formatted as the line number, a period, a space, then the translation, in the "
    "same order and with the same numbers. Do not merge, split, reorder, drop or add "
    "lines. Do not add any preamble, notes or commentary. Preserve names and numbers."
)

# Matches a returned line such as: 12. some translated text
_NUMBERED = re.compile(r"^\s*(\d+)[.)]\s*(.*)$")


def _build_batch_prompt(lines: list[models.Transcript], target_lang: str) -> str:
    target = LANGUAGE_NAMES.get(target_lang, target_lang)
    numbered = "\n".join(f"{i}. {line.text}" for i, line in enumerate(lines, start=1))
    return f"Translate these {len(lines)} lines into {target}.\n\n{numbered}"


def _parse_batch_response(raw: str, expected: int) -> list[str]:
    """Map the model's numbered output back onto the input order.

    Raises ValueError when the reply does not cover every line. A partial or
    reordered translation silently attached to the wrong lines is worse than
    showing the original, so an incomplete reply is treated as a failure.
    """
    found: dict[int, str] = {}
    for raw_line in raw.splitlines():
        match = _NUMBERED.match(raw_line)
        if not match:
            # A wrapped continuation of the previous line; keep it attached.
            if found and raw_line.strip():
                last = max(found)
                found[last] = f"{found[last]} {raw_line.strip()}".strip()
            continue
        index = int(match.group(1))
        if 1 <= index <= expected:
            found[index] = match.group(2).strip()

    missing = [i for i in range(1, expected + 1) if not found.get(i)]
    if missing:
        raise ValueError(
            f"translation covered {expected - len(missing)} of {expected} lines"
        )
    return [found[i] for i in range(1, expected + 1)]


def _read_cache(db: Session, meeting_id: str, lang: str) -> dict[str, str]:
    return {
        row.line_id: row.text
        for row in db.scalars(
            select(models.TranscriptTranslation).where(
                models.TranscriptTranslation.meeting_id == meeting_id,
                models.TranscriptTranslation.lang == lang,
            )
        ).all()
    }


@router.post("/{meeting_id}/translations", response_model=schemas.MeetingTranslations)
def translate_meeting(
    meeting_id: str,
    lang: str = Query(..., description="Target language code, e.g. 'ur'"),
    db: Session = Depends(get_db),
) -> schemas.MeetingTranslations:
    meeting = get_meeting_or_404(db, meeting_id)

    target = lang.strip().lower()
    if target not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {lang}")

    transcripts = list(
        db.scalars(
            select(models.Transcript)
            .where(models.Transcript.meeting_id == meeting.id)
            .order_by(models.Transcript.timestamp_seconds.asc())
        ).all()
    )
    if not transcripts:
        return schemas.MeetingTranslations(
            meeting_id=meeting.id, lang=target, lines=[], cached=True
        )

    cached = _read_cache(db, meeting.id, target)
    missing = [line for line in transcripts if line.id not in cached]

    if not missing:
        return schemas.MeetingTranslations(
            meeting_id=meeting.id,
            lang=target,
            lines=[
                schemas.TranslationLine(line_id=line.id, text=cached[line.id])
                for line in transcripts
            ],
            cached=True,
        )

    provider = _resolve_provider()
    if provider is None:
        raise HTTPException(
            status_code=503, detail="Translation is not configured on this server."
        )

    # Claimed only once a call is genuinely about to happen: a cache hit, an
    # unsupported language or an unconfigured provider must not spend budget.
    budget.reserve_provider_call(db)

    try:
        raw = provider(
            BATCH_SYSTEM_PROMPT,
            _build_batch_prompt(missing, target),
            TRANSLATE_MAX_TOKENS,
        )
        translated = _parse_batch_response(raw, len(missing))
    except ImportError:
        logger.exception("Translation provider SDK is not installed")
        raise HTTPException(
            status_code=503, detail="Translation is not available on this server."
        )
    except ValueError as exc:
        # The provider answered, but not usably.
        logger.warning("Batch translation incomplete (-> %s): %s", target, exc)
        raise HTTPException(
            status_code=502, detail="Translation came back incomplete. Please try again."
        )
    except Exception:
        # Provider errors quote the API key back, so only the type is logged and
        # nothing from the exception reaches the client.
        logger.exception("Batch translation failed (-> %s)", target)
        raise HTTPException(status_code=502, detail="Translation failed. Please try again.")

    for line, text in zip(missing, translated):
        db.add(
            models.TranscriptTranslation(
                meeting_id=meeting.id, line_id=line.id, lang=target, text=text
            )
        )
        cached[line.id] = text

    try:
        db.commit()
    except IntegrityError:
        # Another request cached this language first. Its rows are just as good,
        # so read them back rather than failing the caller.
        db.rollback()
        cached = _read_cache(db, meeting.id, target)

    return schemas.MeetingTranslations(
        meeting_id=meeting.id,
        lang=target,
        lines=[
            schemas.TranslationLine(line_id=line.id, text=cached[line.id])
            for line in transcripts
            if line.id in cached
        ],
        cached=False,
    )
