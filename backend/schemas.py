"""Pydantic request/response schemas."""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


# --- Meeting ---------------------------------------------------------------

class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    languages: str | None = Field(None, description='Comma-separated codes, e.g. "en,es,fr"')
    speaker_count: int = 0
    duration_seconds: int = 0


class MeetingCreate(MeetingBase):
    # Some callers (e.g. seed scripts) send the legacy field names below
    # instead of this schema's own speaker_count/duration_seconds/languages.
    # Map them before validation so those requests stop silently defaulting
    # to 0/0/null; the canonical field names still take priority if present.
    @model_validator(mode="before")
    @classmethod
    def _map_legacy_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        data = dict(data)
        if "speaker_count" not in data and "participants" in data:
            data["speaker_count"] = data["participants"]
        if "duration_seconds" not in data and "duration_minutes" in data:
            data["duration_seconds"] = data["duration_minutes"] * 60
        if "languages" not in data and "language" in data:
            data["languages"] = data["language"]
        return data


class MeetingUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    languages: str | None = None
    speaker_count: int | None = None
    duration_seconds: int | None = None


class MeetingRead(MeetingBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


# --- Transcript ------------------------------------------------------------

class TranscriptCreate(BaseModel):
    text: str = Field(..., min_length=1)
    timestamp_seconds: int = 0
    speaker_name: str | None = None
    original_language: str | None = None


class TranscriptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    text: str
    timestamp_seconds: int
    speaker_name: str | None
    original_language: str | None
    created_at: datetime


# --- Action item -----------------------------------------------------------

class ActionItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    assigned_to: str | None = None
    due_date: date | None = None
    completed: bool = False


class ActionItemUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    assigned_to: str | None = None
    due_date: date | None = None
    completed: bool | None = None


class ActionItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    title: str
    assigned_to: str | None
    due_date: date | None
    completed: bool
    created_at: datetime


# --- Note ------------------------------------------------------------------

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1)
    category: str | None = None


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    content: str
    category: str | None
    created_at: datetime


# --- AI --------------------------------------------------------------------

class AskRequest(BaseModel):
    meeting_id: str
    question: str = Field(..., min_length=1)


class AskResponse(BaseModel):
    response: str


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_lang: str = Field(..., min_length=1, max_length=32)
    target_lang: str = Field(..., min_length=1, max_length=32)


class TranslateResponse(BaseModel):
    original: str
    translated: str
    source_lang: str
    target_lang: str
