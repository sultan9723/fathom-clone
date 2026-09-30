"""Seeding must be safe to run any number of times.

Production ended up with every meeting duplicated because two seed paths ran
against the same database and the only guard was "is the table empty".
"""

import models
from seed import _MEETINGS, seed_if_empty, seed_meetings


def test_demo_content_matches_metadata_and_spans_the_meeting():
    for entry in _MEETINGS:
        lines = entry["transcripts"]
        assert 1200 <= entry["duration_seconds"] <= 3600
        assert len(lines) >= 25
        assert len({speaker for _, speaker, _ in lines}) == entry["speaker_count"]
        assert 3 <= entry["speaker_count"] <= 6
        assert all(speaker and speaker != "Unknown" and len(content.split()) >= 20
                   for _, speaker, content in lines)
        assert lines[0][0] == 0
        assert entry["duration_seconds"] - 60 <= lines[-1][0] < entry["duration_seconds"]
        assert all(a[0] < b[0] for a, b in zip(lines, lines[1:]))


def add_legacy(db, entry, *, single=False):
    from seed import _SINGLE_LINES
    meeting = models.Meeting(**{k: v for k, v in entry.items() if k != "transcripts"})
    if single:
        meeting.languages = "EN"
    db.add(meeting)
    db.flush()
    lines = [(0, None, _SINGLE_LINES[entry["title"]])] if single else entry["transcripts"]
    for stamp, speaker, content in lines:
        db.add(models.Transcript(meeting_id=meeting.id, timestamp_seconds=stamp,
                                 speaker_name=speaker, text=content,
                                 original_language=None if single else "en"))
    db.commit()
    return meeting


def test_repairs_real_legacy_shapes_preserving_user_work_and_ids(db):
    from seed import _LEGACY, repair_demo_meetings
    original = add_legacy(db, _LEGACY[0])
    duplicate = add_legacy(db, _LEGACY[0], single=True)
    original_id, duplicate_id = original.id, duplicate.id
    note = models.Note(meeting_id=duplicate_id, content="Keep this user note")
    item = models.ActionItem(meeting_id=duplicate_id, title="Keep this task")
    line = db.query(models.Transcript).filter_by(meeting_id=original_id).first()
    db.add_all([note, item, models.TranscriptTranslation(meeting_id=original_id,
                line_id=line.id, lang="es", text="Outdated translation")])
    db.commit()
    assert repair_demo_meetings(db)[0]["remove"] == [duplicate_id]
    assert db.query(models.Meeting).count() == 2  # dry run
    db.rollback()
    seed_if_empty(db)
    db.expire_all()
    assert db.query(models.Meeting).one().id == original_id
    assert note.meeting_id == item.meeting_id == original_id
    assert db.query(models.TranscriptTranslation).count() == 0
    assert db.query(models.Transcript).count() == len(_MEETINGS[0]["transcripts"])
    assert repair_demo_meetings(db) == []


def test_never_repairs_a_user_edited_seed_or_same_title_meeting(db):
    from seed import _LEGACY, repair_demo_meetings
    meeting = add_legacy(db, _LEGACY[0])
    line = db.query(models.Transcript).filter_by(meeting_id=meeting.id).first()
    line.text = "A real user's edited content"
    db.commit()
    assert repair_demo_meetings(db, apply=True) == []
    seed_if_empty(db)
    assert db.query(models.Transcript).filter_by(id=line.id).one().text == "A real user's edited content"


def _titles(db):
    return sorted(title for (title,) in db.query(models.Meeting.title).all())


def test_seeding_an_empty_database_inserts_every_meeting(db):
    inserted = seed_meetings(db)

    assert sorted(inserted) == sorted(entry["title"] for entry in _MEETINGS)
    assert _titles(db) == sorted(entry["title"] for entry in _MEETINGS)
    assert db.query(models.Transcript).count() == sum(len(e["transcripts"]) for e in _MEETINGS)


def test_seeding_twice_creates_no_duplicates(db):
    seed_meetings(db)
    first_count = db.query(models.Meeting).count()
    first_transcripts = db.query(models.Transcript).count()

    second = seed_meetings(db)

    assert second == [], "a second seed should insert nothing"
    assert db.query(models.Meeting).count() == first_count
    assert db.query(models.Transcript).count() == first_transcripts
    assert len(_titles(db)) == len(set(_titles(db)))


def test_seeding_many_times_stays_idempotent(db):
    for _ in range(5):
        seed_meetings(db)

    titles = _titles(db)
    assert titles == sorted(set(titles))
    assert len(titles) == len(_MEETINGS)


def test_seeding_restores_only_the_missing_meeting(db):
    seed_meetings(db)
    victim = db.query(models.Meeting).filter_by(title=_MEETINGS[0]["title"]).one()
    db.delete(victim)
    db.commit()

    inserted = seed_meetings(db)

    assert inserted == [_MEETINGS[0]["title"]]
    assert len(_titles(db)) == len(_MEETINGS)


def test_seed_if_empty_seeds_an_empty_table(db):
    seed_if_empty(db)
    assert db.query(models.Meeting).count() == len(_MEETINGS)


def test_seed_if_empty_leaves_a_populated_table_alone(db):
    db.add(models.Meeting(title="Only Meeting", speaker_count=1, duration_seconds=60))
    db.commit()

    seed_if_empty(db)

    assert _titles(db) == ["Only Meeting"]
