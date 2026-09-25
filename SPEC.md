# NoteAI — Global Multilingual Meeting Assistant

## Problem
Multilingual meetings have no real-time cross-language captions.
Fathom transcribes in one language; doesn't solve the multilingual problem.

## Solution
NoteAI transcribes meetings, translates in real-time, and lets you search across all meetings in any language.

## MVP Features
1. **Meeting List** — searchable, with metadata
2. **Meeting Detail** — transcript with language tabs, speaker info
3. **Full-Text Search** — search across all meetings in any language
4. **Action Items** — tracked and checkable
5. **AI Q&A** — ask Claude questions about the meeting

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + Shadcn/ui
- **Backend:** FastAPI + SQLAlchemy + SQLite (MVP)
- **Database:** SQLite (local), Supabase PostgreSQL (production)
- **Deployment:** Vercel (frontend) + Render.com (backend)
- **AI:** Claude API (ask feature)

## Data Model
Meeting
├── id (UUID)
├── title (string)
├── description (text)
├── languages (string, comma-separated: "en,es,fr")
├── speaker_count (int)
├── duration_seconds (int)
└── created_at (timestamp)

Transcript
├── id (UUID)
├── meeting_id (FK)
├── text (string)
├── timestamp_seconds (int)
├── speaker_name (string)
├── original_language (string: "en")
└── created_at (timestamp)

ActionItem
├── id (UUID)
├── meeting_id (FK)
├── title (string)
├── assigned_to (string)
├── due_date (date)
├── completed (boolean)
└── created_at (timestamp)

## API Routes
GET /api/v1/health
GET /api/v1/meetings
POST /api/v1/meetings
GET /api/v1/meetings/{id}
PUT /api/v1/meetings/{id}
DELETE /api/v1/meetings/{id}
GET /api/v1/meetings/{id}/transcripts
POST /api/v1/meetings/{id}/transcripts
GET /api/v1/search?q=
POST /api/v1/ai/ask
GET /api/v1/meetings/{id}/action-items
PATCH /api/v1/meetings/{id}/action-items/{item_id}

## MVP Success Criteria
- [ ] Create meeting → saved to DB
- [ ] Paste transcript → stored with timestamps
- [ ] Search across meetings works
- [ ] Click meeting → detail page
- [ ] AI Q&A returns response (or graceful fallback)
- [ ] Mobile responsive (375px)
- [ ] No console errors
- [ ] Deployed to Vercel + Render
- [ ] Agent logs committed
- [ ] Clean git history