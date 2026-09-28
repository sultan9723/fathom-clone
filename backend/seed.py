"""Startup seed data.

Render's disk isn't persistent across deploys, so every restart starts from
an empty database. seed_if_empty() runs once at app startup (see main.py's
lifespan) and only inserts anything when the meetings table is empty.

That table-level guard alone wasn't enough: production ended up with every
meeting twice because auto-seed ran and a manual seed script ran too, each
seeing a state the other's guard didn't cover. seed_meetings() is therefore
idempotent per row — it checks each seed title against the table and inserts
only what's missing — so seeding any number of times, by any route, can never
create a duplicate. Use backend/scripts/dedupe_meetings.py to clean up a
database that already has them.
"""

from sqlalchemy.orm import Session

import models

_MEETINGS: list[dict] = [
    {
        "title": "Sales Pipeline Review",
        "description": "Monthly forecast and customer updates",
        "languages": "en",
        "speaker_count": 4,
        "duration_seconds": 1800,
        "transcripts": [
            (0, "David", "Let's get started. This month's pipeline is looking strong across all regions."),
            (25, "Jessica", "Agreed. We've got three major deals slated to close before quarter end."),
            (60, "David", "Walk us through the forecast numbers for the West region."),
            (95, "Marcus", "West is tracking about 12% ahead of target, mostly driven by the Atlas renewal."),
            (140, "Priya", "On the customer side, churn risk is down. Support tickets from our top accounts are trending well."),
            (180, "David", "Good. Let's follow up individually on the three big deals and reconvene next week."),
        ],
    },
    {
        "title": "Q4 Engineering Roadmap",
        "description": "Quarterly planning and team capacity review",
        "languages": "en",
        "speaker_count": 5,
        "duration_seconds": 2700,
        "transcripts": [
            (0, "Aisha", "Welcome everyone. Today we're finalizing the Q4 roadmap and checking capacity."),
            (30, "Tom", "The platform team has bandwidth for two of the three proposed migrations."),
            (75, "Elena", "I'd prioritize the auth service migration — it's blocking the mobile team."),
            (120, "Raj", "Mobile agrees. We can't ship offline mode until that's done."),
            (160, "Tom", "Understood, we'll move it to the top of the sprint board."),
            (210, "Aisha", "Let's also lock the API versioning plan before the next release cut."),
            (250, "Elena", "I'll draft the versioning doc and share it by Friday."),
        ],
    },
    {
        "title": "Product Atlas Kickoff",
        "description": "New feature launch strategy",
        "languages": "en",
        "speaker_count": 3,
        "duration_seconds": 1200,
        "transcripts": [
            (0, "Sofia", "This is the kickoff for Atlas — our new mapping feature. Let's cover scope first."),
            (35, "Ben", "Phase one is read-only maps with live location markers, no editing yet."),
            (80, "Nina", "From a design side, I want to keep the map full-bleed on mobile with a bottom sheet for details."),
            (130, "Sofia", "Sounds good. What's realistic for a phase one launch date?"),
            (160, "Ben", "If scope stays fixed, we can target a six-week build."),
            (190, "Nina", "I'll have mockups ready for review by end of next week."),
        ],
    },
]


def seed_meetings(db: Session) -> list[str]:
    """Insert every seed meeting not already present, matched by title.

    Safe to call repeatedly: titles already in the table are skipped, so this
    adds missing seed rows without ever duplicating existing ones. Returns the
    titles it inserted.
    """
    existing_titles = {title for (title,) in db.query(models.Meeting.title).all()}
    inserted: list[str] = []

    for entry in _MEETINGS:
        if entry["title"] in existing_titles:
            continue

        meeting = models.Meeting(
            title=entry["title"],
            description=entry["description"],
            languages=entry["languages"],
            speaker_count=entry["speaker_count"],
            duration_seconds=entry["duration_seconds"],
        )
        db.add(meeting)
        db.flush()  # assigns meeting.id for the transcripts below

        for timestamp_seconds, speaker_name, text in entry["transcripts"]:
            db.add(
                models.Transcript(
                    meeting_id=meeting.id,
                    text=text,
                    timestamp_seconds=timestamp_seconds,
                    speaker_name=speaker_name,
                    original_language=entry["languages"],
                )
            )

        # Guard against the same title appearing twice in _MEETINGS itself.
        existing_titles.add(entry["title"])
        inserted.append(entry["title"])

    if inserted:
        db.commit()
    return inserted


def seed_if_empty(db: Session) -> None:
    """Startup hook: seed only a completely empty meetings table."""
    if db.query(models.Meeting).count() > 0:
        return
    seed_meetings(db)
