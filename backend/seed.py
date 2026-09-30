"""Versioned demo data; repair only complete known seed fingerprints.

Titles alone never identify disposable data. Existing IDs, notes, and action
items survive a repair. User-edited transcripts and metadata are left intact.
"""
import json
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import text
from sqlalchemy.orm import Session

import models

_MEETINGS = json.loads(Path(__file__).with_name("seed_data.json").read_text(encoding="utf-8"))
_LEGACY = json.loads(Path(__file__).with_name("seed_legacy.json").read_text(encoding="utf-8"))
_SINGLE_LINES = {
    "Sales Pipeline Review": "Let's discuss the sales pipeline for Q4. We've seen strong growth in enterprise deals.",
    "Q4 Engineering Roadmap": "Our roadmap focuses on API performance improvements and real-time collaboration features.",
    "Product Atlas Kickoff": "Project Atlas is our new global initiative. We're launching in three regions simultaneously.",
}


def _lock(db: Session) -> None:
    # Serialize startup/manual seed paths across PostgreSQL workers.
    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(735918240)"))


def _signature(lines):
    return sorted(((line.timestamp_seconds, line.speaker_name, line.text, line.original_language)
                   for line in lines), key=lambda row: (row[0], row[1] or "", row[2], row[3] or ""))


def _expected(entry):
    return sorted((stamp, speaker, content, entry["languages"])
                  for stamp, speaker, content in entry["transcripts"])


def _known(db: Session, meeting, entry) -> bool:
    legacy = next(item for item in _LEGACY if item["title"] == entry["title"])
    descriptions = {entry["description"], legacy["description"]}
    if entry["title"] == "Q4 Engineering Roadmap":
        descriptions.add("Sprint planning and API improvements")
    if (meeting.description not in descriptions or
            meeting.languages not in {"en", "EN"} or
            meeting.speaker_count != entry["speaker_count"] or
            meeting.duration_seconds != entry["duration_seconds"]):
        return False
    actual = _signature(db.query(models.Transcript).filter_by(meeting_id=meeting.id).all())
    return actual in [_expected(entry), _expected(legacy),
                      [(0, None, _SINGLE_LINES[entry["title"]], None)]]


def _write_lines(db: Session, meeting_id: str, entry) -> None:
    for timestamp, speaker, content in entry["transcripts"]:
        db.add(models.Transcript(meeting_id=meeting_id, timestamp_seconds=timestamp,
                                 speaker_name=speaker, text=content, original_language="en"))


def repair_demo_meetings(db: Session, *, apply: bool = False) -> list[dict]:
    """Report or repair exact known demo rows; caller owns the transaction."""
    _lock(db)
    report = []
    for entry in _MEETINGS:
        candidates = db.query(models.Meeting).filter_by(title=entry["title"]).order_by(
            models.Meeting.created_at, models.Meeting.id).all()
        known = [meeting for meeting in candidates if _known(db, meeting, entry)]
        if not known:
            continue
        keep, *duplicates = known
        lines = db.query(models.Transcript).filter_by(meeting_id=keep.id).all()
        rewrite = _signature(lines) != _expected(entry)
        if not rewrite and not duplicates:
            continue
        report.append({"title": entry["title"], "keep": keep.id,
                       "remove": [m.id for m in duplicates], "replace_transcript": rewrite})
        if not apply:
            continue
        for duplicate in duplicates:
            for model in (models.ActionItem, models.Note):
                db.query(model).filter_by(meeting_id=duplicate.id).update({"meeting_id": keep.id})
            for model in (models.TranscriptTranslation, models.Transcript):
                db.query(model).filter_by(meeting_id=duplicate.id).delete(synchronize_session=False)
            db.delete(duplicate)
        if rewrite:
            db.query(models.TranscriptTranslation).filter_by(meeting_id=keep.id).delete(synchronize_session=False)
            db.query(models.Transcript).filter_by(meeting_id=keep.id).delete(synchronize_session=False)
            _write_lines(db, keep.id, entry)
        keep.languages = "en"
        db.flush()
    return report


def seed_meetings(db: Session) -> list[str]:
    """Seed missing titles, repairing only exact known demo fingerprints."""
    _lock(db)
    repair_demo_meetings(db, apply=True)
    existing = {title for (title,) in db.query(models.Meeting.title).all()}
    inserted = []
    for entry in _MEETINGS:
        if entry["title"] in existing:
            continue
        meeting = models.Meeting(
            id=str(uuid5(NAMESPACE_URL, f'noteai:demo:{entry["title"]}')),
            **{key: value for key, value in entry.items() if key != "transcripts"})
        db.add(meeting)
        db.flush()
        _write_lines(db, meeting.id, entry)
        existing.add(entry["title"])
        inserted.append(entry["title"])
    db.commit()
    return inserted


def seed_if_empty(db: Session) -> None:
    """Repair known seeds on startup; do not populate a user-only workspace."""
    _lock(db)
    if db.query(models.Meeting).count() == 0:
        seed_meetings(db)
    else:
        repair_demo_meetings(db, apply=True)
        db.commit()
