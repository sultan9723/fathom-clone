# Fathom Clone — Spec

## Goal
Rebuild the core experience of Fathom (fathom.video) as a polished,
deployed web app in one day for 8x startup take-home assessment.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + lucide-react
- Typed JSON seed files in /data/meetings/
- AI via server API route (Claude or OpenAI, graceful fallback)
- Deployed on Vercel

## Pages
- /meetings — meeting list with search
- /meetings/[id] — meeting detail (the main page)
- /api/ask — AI Q&A route

## Meeting Detail Components
- VideoPlayer — HTML5 video, custom controls
- PlayerProvider — React context, single source of currentTime
- TranscriptPanel — synced to video, click to seek, search
- SummaryPanel — overview + key points + decisions
- ActionItems — checkable list
- Highlights — clips with timestamps
- Participants — avatars + names
- AskPanel — Q&A over transcript via /api/ask
- ShareModal — copy link with ?t= timestamp

## Data Layer
- MeetingRepository interface in lib/repository.ts
- JsonMeetingRepository reads from /data/meetings/*.json
- Swap for DB later without touching UI

## AI Layer
- AIProvider interface in lib/ai/provider.ts
- ClaudeProvider, OpenAIProvider, MockProvider
- Chosen by AI_PROVIDER env var
- MockProvider used when no key present
- TranscriptIndex class for Q&A context (tokenize + score lines)

## Key Engineering Decisions
- PlayerProvider owns currentTime — no duplicated time state
- Binary search O(log n) for active transcript line lookup
- URL state: ?t=seconds for shareable timestamp links
- Precomputed summaries in seed data (fast, free)
- Live AI only for Q&A with graceful fallback
- Throttle timeupdate to ~4x per second

## Scope — Deliberately Stubbed
- Recording bot (Zoom/Meet/Teams join)
- Calendar integration
- CRM sync
- Auth and real accounts
- Speech-to-text

## Data Model (see lib/types.ts for full types)
- Participant: id, name, email, color, avatarUrl
- TranscriptLine: id, speakerId, start, end, text (seconds)
- ActionItem: id, text, assigneeId, timestamp, done
- Highlight: id, title, start, end
- Meeting: id, title, date, durationSec, videoUrl, platform,
  participants, transcript, summary, actionItems, highlights

## Seed Data Requirements
- 5 realistic meetings
- 3-6 speakers each
- 20-60 min duration
- Full transcripts (30+ lines)
- Real-looking names, topics, action items
- videoUrl: a public sample MP4 that permits hotlinking.
  Currently test-videos.co.uk (Big Buck Bunny, 720p/10s).
  Not w3schools — that host 403s requests without a browser
  User-Agent and did not load reliably in testing.

## Folder Structure
app/
  meetings/page.tsx
  meetings/[id]/page.tsx
  api/ask/route.ts
  layout.tsx
  page.tsx
components/
  meeting-list/
  meeting-detail/
  share/
  ui/
lib/
  types.ts
  repository.ts
  transcript.ts
  ai/provider.ts
data/meetings/*.json
public/media/
tests/

## Definition of Done
- npm run build passes with zero errors
- Live Vercel URL works on mobile and desktop
- Video plays and transcript syncs to it
- AI Q&A works or fails gracefully
- README has live link, stack, what is stubbed and why
- No secrets in repo
- Clean commit history
