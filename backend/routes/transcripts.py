"""Transcript lines nested under a meeting."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from routes.meetings import get_meeting_or_404

router = APIRouter(prefix="/api/v1/meetings", tags=["transcripts"])


@router.get("/{meeting_id}/transcripts", response_model=list[schemas.TranscriptRead])
def list_transcripts(meeting_id: str, db: Session = Depends(get_db)):
    get_meeting_or_404(db, meeting_id)
    stmt = (
        select(models.Transcript)
        .where(models.Transcript.meeting_id == meeting_id)
        .order_by(models.Transcript.timestamp_seconds.asc())
    )
    return db.scalars(stmt).all()


@router.post(
    "/{meeting_id}/transcripts",
    response_model=schemas.TranscriptRead,
    status_code=status.HTTP_201_CREATED,
)
def create_transcript(
    meeting_id: str, payload: schemas.TranscriptCreate, db: Session = Depends(get_db)
):
    get_meeting_or_404(db, meeting_id)
    transcript = models.Transcript(meeting_id=meeting_id, **payload.model_dump())
    db.add(transcript)
    db.commit()
    return transcript
