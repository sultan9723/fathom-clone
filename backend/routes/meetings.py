"""Meeting CRUD, action items, and cross-meeting search."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])
search_router = APIRouter(prefix="/api/v1", tags=["search"])


def get_meeting_or_404(db: Session, meeting_id: str) -> models.Meeting:
    """Fetch a meeting by id or raise 404. Shared with the transcript and AI routes."""
    meeting = db.get(models.Meeting, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("", response_model=list[schemas.MeetingRead])
def list_meetings(
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = (
        select(models.Meeting)
        .order_by(models.Meeting.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return db.scalars(stmt).all()


@router.post("", response_model=schemas.MeetingRead, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    meeting = models.Meeting(**payload.model_dump())
    db.add(meeting)
    db.commit()
    return meeting


@router.get("/{meeting_id}", response_model=schemas.MeetingRead)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    return get_meeting_or_404(db, meeting_id)


@router.put("/{meeting_id}", response_model=schemas.MeetingRead)
def update_meeting(
    meeting_id: str, payload: schemas.MeetingUpdate, db: Session = Depends(get_db)
):
    meeting = get_meeting_or_404(db, meeting_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(meeting, field, value)
    db.commit()
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = get_meeting_or_404(db, meeting_id)
    db.delete(meeting)
    db.commit()


# --- Action items -----------------------------------------------------------

@router.get("/{meeting_id}/action-items", response_model=list[schemas.ActionItemRead])
def list_action_items(meeting_id: str, db: Session = Depends(get_db)):
    get_meeting_or_404(db, meeting_id)
    stmt = (
        select(models.ActionItem)
        .where(models.ActionItem.meeting_id == meeting_id)
        .order_by(models.ActionItem.created_at.asc())
    )
    return db.scalars(stmt).all()


@router.post(
    "/{meeting_id}/action-items",
    response_model=schemas.ActionItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_action_item(
    meeting_id: str, payload: schemas.ActionItemCreate, db: Session = Depends(get_db)
):
    get_meeting_or_404(db, meeting_id)
    item = models.ActionItem(meeting_id=meeting_id, **payload.model_dump())
    db.add(item)
    db.commit()
    return item


@router.patch("/{meeting_id}/action-items/{item_id}", response_model=schemas.ActionItemRead)
def update_action_item(
    meeting_id: str,
    item_id: str,
    payload: schemas.ActionItemUpdate,
    db: Session = Depends(get_db),
):
    """Partial update; with an empty body this simply marks the item done."""
    item = db.get(models.ActionItem, item_id)
    if item is None or item.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Action item not found")

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        changes = {"completed": True}
    for field, value in changes.items():
        setattr(item, field, value)
    db.commit()
    return item


# --- Search ----------------------------------------------------------------

@search_router.get("/search", response_model=list[schemas.MeetingRead])
def search_meetings(
    q: str = Query("", description="Free-text query across meetings and transcripts"),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    term = q.strip()
    if not term:
        return []

    pattern = f"%{term}%"
    stmt = (
        select(models.Meeting)
        .outerjoin(models.Transcript, models.Transcript.meeting_id == models.Meeting.id)
        .where(
            or_(
                models.Meeting.title.ilike(pattern),
                models.Meeting.description.ilike(pattern),
                models.Meeting.languages.ilike(pattern),
                models.Transcript.text.ilike(pattern),
            )
        )
        .distinct()
        .order_by(models.Meeting.created_at.desc())
        .limit(limit)
    )
    return db.scalars(stmt).all()
