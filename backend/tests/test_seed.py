"""Seeding must be safe to run any number of times.

Production ended up with every meeting duplicated because two seed paths ran
against the same database and the only guard was "is the table empty".
"""

import models
from seed import _MEETINGS, seed_if_empty, seed_meetings


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
