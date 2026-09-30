#!/usr/bin/env python
"""One-off cleanup for meetings duplicated by an earlier double-seed.

Groups meetings by title, keeps the oldest row in each group (by created_at,
then id as a stable tie-break) and removes the rest along with their
transcripts, action items, notes and cached translations.

Dry run is the default: without --apply nothing is written, the script only
prints what it would delete. DATABASE_URL comes from the environment (or
backend/.env, via database.py) and must point at a local database — pass
--allow-remote to override that check, which exists so this never runs
against production by accident.

    # from backend/
    python scripts/dedupe_meetings.py                 # report only
    python scripts/dedupe_meetings.py --apply         # actually delete
"""

from __future__ import annotations

import argparse
import os
import sys
from urllib.parse import urlsplit

# The backend modules import each other flat ("import models"), so the backend
# directory has to be importable when this runs from backend/scripts/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models  # noqa: E402
from database import DATABASE_URL, SessionLocal  # noqa: E402

LOCAL_HOSTS = {"", "localhost", "127.0.0.1", "::1", "host.docker.internal"}


def _host(url: str) -> str:
    # sqlite URLs have no netloc, which reads as local — that's correct.
    return (urlsplit(url).hostname or "").lower()


def _describe(url: str) -> str:
    """The URL with any password removed, safe to print."""
    parts = urlsplit(url)
    if parts.hostname is None:
        return url
    port = f":{parts.port}" if parts.port else ""
    user = f"{parts.username}@" if parts.username else ""
    return f"{parts.scheme}://{user}{parts.hostname}{port}{parts.path}"


def find_duplicate_groups(db) -> list[tuple[str, list[models.Meeting]]]:
    """Titles with more than one meeting, each group oldest-first."""
    meetings = (
        db.query(models.Meeting)
        .order_by(models.Meeting.created_at.asc(), models.Meeting.id.asc())
        .all()
    )

    groups: dict[str, list[models.Meeting]] = {}
    for meeting in meetings:
        groups.setdefault(meeting.title, []).append(meeting)

    return [(title, rows) for title, rows in groups.items() if len(rows) > 1]


def _child_counts(db, meeting_id: str) -> dict[str, int]:
    return {
        "transcripts": db.query(models.Transcript).filter_by(meeting_id=meeting_id).count(),
        "action items": db.query(models.ActionItem).filter_by(meeting_id=meeting_id).count(),
        "notes": db.query(models.Note).filter_by(meeting_id=meeting_id).count(),
        "translations": db.query(models.TranscriptTranslation).filter_by(meeting_id=meeting_id).count(),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="actually delete the duplicates (default is a dry run that writes nothing)",
    )
    parser.add_argument(
        "--allow-remote",
        action="store_true",
        help="permit --apply against a non-local DATABASE_URL (never use on production)",
    )
    args = parser.parse_args(argv)

    print(f"Database: {_describe(DATABASE_URL)}")

    if args.apply and _host(DATABASE_URL) not in LOCAL_HOSTS and not args.allow_remote:
        print(
            f"\nRefusing to --apply against non-local host '{_host(DATABASE_URL)}'.\n"
            "Point DATABASE_URL at your local database, or pass --allow-remote if you\n"
            "are certain this is not production.",
            file=sys.stderr,
        )
        return 2

    db = SessionLocal()
    try:
        total_before = db.query(models.Meeting).count()
        groups = find_duplicate_groups(db)

        print(f"Meetings: {total_before}")
        if not groups:
            print("No duplicate titles found. Nothing to do.")
            return 0

        doomed: list[models.Meeting] = []
        for title, rows in groups:
            keep, rest = rows[0], rows[1:]
            print(f"\n{title!r} - {len(rows)} copies")
            print(f"  keep    {keep.id}  created {keep.created_at}")
            for meeting in rest:
                children = ", ".join(f"{n} {label}" for label, n in _child_counts(db, meeting.id).items())
                print(f"  delete  {meeting.id}  created {meeting.created_at}  ({children})")
                doomed.append(meeting)

        verb = "Deleting" if args.apply else "Would delete"
        print(f"\n{verb} {len(doomed)} meeting(s) across {len(groups)} duplicated title(s).")

        if not args.apply:
            print("Dry run - nothing was changed. Re-run with --apply to delete.")
            return 0

        ids = [meeting.id for meeting in doomed]
        for model in (models.TranscriptTranslation, models.Transcript, models.ActionItem, models.Note):
            model_query = db.query(model).filter(model.meeting_id.in_(ids))
            removed = model_query.delete(synchronize_session=False)
            print(f"  removed {removed} {model.__tablename__}")
        removed = db.query(models.Meeting).filter(models.Meeting.id.in_(ids)).delete(synchronize_session=False)
        db.commit()

        print(f"  removed {removed} meetings")
        print(f"Meetings remaining: {db.query(models.Meeting).count()}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
