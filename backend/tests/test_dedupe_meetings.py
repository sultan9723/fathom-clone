"""The duplicate-cleanup script.

Driven through its real command line (subprocess) rather than by importing
main(), so the dry-run default, the flags and the exit codes are all covered
the way an operator would actually hit them.
"""

import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

import models

BACKEND_DIR = Path(__file__).resolve().parent.parent
SCRIPT = BACKEND_DIR / "scripts" / "dedupe_meetings.py"


def run_script(*args, database_url=None):
    env = {**os.environ, "DATABASE_URL": database_url or os.environ["DATABASE_URL"]}
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def make_meeting(db, title, *, age_minutes, transcripts=1, action_items=1):
    """A meeting with children; `age_minutes` sets how old it is."""
    meeting = models.Meeting(
        title=title,
        description=f"{title} description",
        speaker_count=3,
        duration_seconds=600,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None)
        - timedelta(minutes=age_minutes),
    )
    db.add(meeting)
    db.flush()

    for i in range(transcripts):
        db.add(
            models.Transcript(
                meeting_id=meeting.id, text=f"line {i}", timestamp_seconds=i * 10
            )
        )
    for i in range(action_items):
        db.add(models.ActionItem(meeting_id=meeting.id, title=f"todo {i}"))

    db.commit()
    return meeting


@pytest.fixture
def duplicates(db):
    """Three titles, each present three times, oldest copy recorded."""
    oldest = {}
    for title in ("Sales Pipeline Review", "Q4 Engineering Roadmap", "Product Atlas Kickoff"):
        for age in (5, 30, 90):  # 90 minutes old is the one to keep
            meeting = make_meeting(db, title, age_minutes=age)
            if age == 90:
                oldest[title] = meeting.id
    assert db.query(models.Meeting).count() == 9
    return oldest


def test_dry_run_is_the_default_and_deletes_nothing(db, duplicates):
    result = run_script()

    assert result.returncode == 0, result.stderr
    assert "Would delete 6 meeting(s)" in result.stdout
    assert "Dry run" in result.stdout
    assert db.query(models.Meeting).count() == 9
    assert db.query(models.Transcript).count() == 9
    assert db.query(models.ActionItem).count() == 9


def test_apply_keeps_the_oldest_meeting_per_title(db, duplicates):
    result = run_script("--apply")

    assert result.returncode == 0, result.stderr
    assert db.query(models.Meeting).count() == 3

    remaining = {m.title: m.id for m in db.query(models.Meeting).all()}
    assert remaining == duplicates


def test_apply_removes_transcripts_and_action_items_of_deleted_meetings(db, duplicates):
    run_script("--apply")

    surviving_ids = {m.id for m in db.query(models.Meeting).all()}
    assert db.query(models.Transcript).count() == 3
    assert db.query(models.ActionItem).count() == 3
    assert {t.meeting_id for t in db.query(models.Transcript).all()} == surviving_ids
    assert {a.meeting_id for a in db.query(models.ActionItem).all()} == surviving_ids


def test_apply_is_idempotent(db, duplicates):
    run_script("--apply")
    second = run_script("--apply")

    assert second.returncode == 0, second.stderr
    assert "No duplicate titles found" in second.stdout
    assert db.query(models.Meeting).count() == 3


def test_distinct_titles_are_never_touched(db):
    for title in ("One", "Two", "Three"):
        make_meeting(db, title, age_minutes=10)

    result = run_script("--apply")

    assert "No duplicate titles found" in result.stdout
    assert db.query(models.Meeting).count() == 3


def test_apply_refuses_a_remote_database(db, duplicates):
    result = run_script(
        "--apply",
        database_url="postgresql://u:p@db.example.com:5432/noteai",
    )

    assert result.returncode == 2
    assert "Refusing to --apply" in result.stderr
    assert db.query(models.Meeting).count() == 9, "the local database must be untouched"


def test_output_never_prints_the_password(db, duplicates):
    result = run_script()

    assert "devpass" not in result.stdout
    assert "devpass" not in result.stderr
