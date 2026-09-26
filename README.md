# NoteAI

**Meeting search + AI Q&A + Real-time multilingual translation for global teams.**

## What is NoteAI?

NoteAI solves a real problem: when your team speaks different languages in the same meeting, everyone misses context. We provide real-time transcription, AI-powered summaries, and instant translation — so language is never a barrier.

## Features

- **Meeting Search**: Cross-meeting search. Find anything across all your meetings instantly.
- **AI Summary**: Groq-powered summaries of meeting content, key points, and decisions.
- **Ask Anything**: Ask questions about any meeting and get AI answers in seconds.
- **Real-time Multilingual Translation**: Translate transcripts to 8 languages on-the-fly.
- **Action Items**: Track decisions and follow-ups from every meeting.
- **Premium UI**: Dark theme with cyan accents, responsive design, smooth interactions.

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui → Vercel
- **Backend**: FastAPI (Python) → Render.com
- **Database**: PostgreSQL 18 on Render (production-grade, persistent)
- **AI**: Groq API (multilingual translation, summarization, Q&A)

## Live Demo

**Frontend**: https://fathom-clone-jade.vercel.app/meetings

**Backend API**: https://noteai-backend-ja5c.onrender.com/api/v1/health

## Deployment

- **Backend Database**: PostgreSQL 18 on Render (auto-seeds 3 meetings on startup)

## API Routes

GET /api/v1/health

GET /api/v1/meetings

POST /api/v1/meetings

GET /api/v1/meetings/{id}

GET /api/v1/meetings/{id}/transcripts

POST /api/v1/ai/ask

POST /api/v1/ai/translate

GET /api/v1/meetings/{id}/action-items

## Getting Started

### Frontend (Local)

```bash
npm install
NEXT_PUBLIC_API_URL=https://noteai-backend-ja5c.onrender.com/api npm run dev
# Open http://localhost:3000/meetings
```

### Backend (Local)

```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### Environment Variables

```bash
DATABASE_URL=postgresql://noteai_user:PASSWORD@dpg-dartft8473hc73ev1d4g-a/noteai
```

## Design Philosophy

- **Light theme** for accessibility (WCAG AA contrast)
- **Cyan accents** (#00d4ff) for NoteAI brand
- **Premium badges** on meeting cards (speakers, duration, language)
- **Responsive** at 375px mobile to 1440px desktop
- **Real data** — no mock responses. Every meeting fetches from PostgreSQL. Every AI response comes from Groq.

## What's Next

- Video playback integration (Zoom, Google Meet)
- Live recording support
- Slack bot for action item tracking
- Browser extension for automatic meeting capture
- Mobile app

## Why NoteAI?

Fathom transcribes meetings. NoteAI **connects global teams** where English, Spanish, Urdu, Japanese, Chinese, French, German, Portuguese, and Arabic speakers collaborate in real time. Your language shouldn't be a barrier. Your meeting shouldn't need translation after the fact.
