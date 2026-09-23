# NoteAI

A meeting notetaker in the spirit of [Fathom](https://fathom.video), rebuilt from measured
design tokens rather than the Fathom name or wordmark: recorded meetings with a transcript
synced to the video, AI-generated summaries, action items, and Q&A over the transcript.

**Live:** https://fathom-clone-jade.vercel.app

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS**, **lucide-react**
- **Vitest** — 37 tests
- Typed JSON seed data in `data/meetings/`
- AI via a server route, with Claude / OpenAI / Mock providers

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:run     # tests
npm run build        # production build
```

The app runs with no configuration. To enable live AI answers, copy `.env.example` to
`.env.local` and set:

```bash
AI_PROVIDER=claude          # claude | openai | mock
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key the Q&A panel falls back to transcript retrieval — it still answers, it just
does not paraphrase.

## Architecture

**`MeetingRepository` (`lib/repository.ts`)** is the seam between the UI and storage.
`JsonMeetingRepository` reads `data/meetings/*.json`; swapping in Postgres means writing one
class and changing one line in `getMeetingRepository()`. The list view uses a
`MeetingListItem` projection so a page of cards does not ship every transcript.

**`PlayerProvider` (`components/meeting-detail/player-provider.tsx`)** owns `currentTime` as
the single source of truth. No other component keeps its own copy — the transcript, the
highlights, the action-item jump links and the share modal all read from it.

**Transcript sync** uses binary search (`findActiveLineIndex`) to locate the active line in
O(log n) on every `timeupdate`, throttled to 4×/second.

**Design tokens** (`lib/design-tokens.ts`) are the single source of colour, type and
component sizing; `tailwind.config.ts` derives every utility class from them, so a value
changes in one place. The meeting detail page is a persistent video player above a
Summary/Transcript/Ask tab switcher plus a Notes column (title, date, share, action items);
the meeting list page pairs a container-queried card grid (`@tailwindcss/container-queries`
— breakpoints key off the list column's width, not the viewport, since a fixed-width Ask
sidebar sits beside it) with that same Ask flow, scoped to whichever meeting you pick from
its dropdown.

**Q&A** (`lib/ai/provider.ts`, `app/api/ask/route.ts`) retrieves the handful of transcript
lines bearing on a question via BM25 and sends only those to the model. The API key stays
server-side: the browser posts a meeting id and a question, and the route loads the
transcript itself rather than trusting anything the client sends about its contents.

### Two decisions worth calling out

**Time scaling.** The demo video is a short public sample clip, but the meetings are 25–53
minutes. Rather than truncate the seed data to match the clip, `PlayerProvider` maps meeting
seconds onto media seconds once the real duration is known, so the full transcript stays in
sync and every seek lands where it should. Against a real recording the scale factor is 1
and the mapping disappears. The player says so on screen rather than quietly misrepresenting
the timeline.

**BM25 over TF-IDF.** Transcripts are full of three-word interjections ("The export
feature.") that match every query term and would outrank the line that actually answers the
question. BM25's length normalisation fixes the ranking; a forward walk from a short hit
reaches the reply, which usually shares no vocabulary with the question at all.

## Deliberately stubbed

These are out of scope for a one-day build, and each would be a project of its own:

| Not built | Why, and what it would take |
|---|---|
| Recording bot (Zoom/Meet/Teams) | Per-platform bot SDKs, OAuth, and media pipelines. The seed data models what the bot would produce. |
| Speech-to-text | The transcripts are authored fixtures. Real STT means Whisper/Deepgram plus diarization to attribute lines to speakers. |
| Auth and accounts | No user model; every meeting is public. The header avatar is a static placeholder, and action-item checkboxes/inline title rename are session-scoped rather than faking a save. |
| Calendar / CRM sync | Integration surface, not product surface. |
| Team Calls / Playlists / Alerts / Deals, Settings, Help | The app shell mirrors Fathom's real navigation chrome, but only "My Calls" (`/meetings`) is a built page. The rest render inert rather than linking to routes that don't exist. |
| Summary generation | Summaries are precomputed in the seed data — fast, free, and deterministic for a demo. Only Q&A calls a model live. |

## Tests

```
tests/transcript.test.ts   binary search, tokenizer, BM25 ranking, context building
tests/repository.test.ts   loading, sorting, filtering, seed-data referential integrity
tests/ask.test.ts          retrieval quality and citation correctness
```

The repository tests assert referential integrity across the seed files — every
`speakerId` resolves, every timestamp falls inside the meeting, every transcript is ordered.
