"""SQLAlchemy ORM models for NoteAI."""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Comma-separated language codes, e.g. "en,es,fr"
    languages: Mapped[str | None] = mapped_column(String(255), nullable=True)
    speaker_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)

    transcripts: Mapped[list["Transcript"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    action_items: Mapped[list["ActionItem"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    translations: Mapped[list["TranscriptTranslation"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    speaker_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="transcripts")


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="action_items")


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="notes")


class TranscriptTranslation(Base):
    """One transcript line rendered into one language.

    A translation costs a provider call, so it is written once and read back
    on every later request for the same line and language. The unique
    constraint is what makes that safe under concurrent requests: two callers
    asking for the same language at once cannot both insert.
    """

    __tablename__ = "transcript_translations"
    __table_args__ = (
        UniqueConstraint("line_id", "lang", name="uq_translation_line_lang"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    line_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # BCP 47 base code: "ur", "zh", "es", ...
    lang: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="translations")


class ProviderUsage(Base):
    """One row per UTC day, counting provider calls made that day.

    This backs the global spend ceiling in budget.py. It lives in the
    database rather than process memory because an in-memory counter would
    reset on every restart and count separately per instance — neither
    durable nor global, which is the whole point of a total budget.
    """

    __tablename__ = "provider_usage"

    # YYYY-MM-DD in UTC. A string rather than a Date so the upsert's conflict
    # target is trivially portable and the value reads the same everywhere.
    day: Mapped[str] = mapped_column(String(10), primary_key=True)
    calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
