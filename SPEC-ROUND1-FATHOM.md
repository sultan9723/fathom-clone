# Fathom Clone — Spec

## Goal
Rebuild the core experience of Fathom (fathom.video) as a polished,
deployed web app in one day for 8x startup take-home assessment.
Product name: NoteAI (not Fathom — use your own branding).

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

---

## Design System (measured from live Fathom DOM — Sep 2026)

> All values below were extracted with getComputedStyle from the
> live app, not estimated from screenshots.

### Colors — Surfaces
| Token | Hex | Used for |
|---|---|---|
| page bg | #1A1A1A | main background |
| topbar | #212124 | header + tab bar |
| surface-1 | #121314 | popover menus |
| surface-2 | #1D1E1F | inputs, text on brand buttons |
| surface-3 | #26262A | card caption on hover |
| surface-4 | #29292E | — |
| surface-5 | #343435 | small buttons, dropdowns |
| border | #4A4B4B | avatar placeholder, icons |
| border-faint | #616162 | section labels, input borders |
| search-pill | #2D2C31 | header search field |
| video-panel | #000000 | video player + transcript bg |

### Colors — Text
| Token | Hex | Used for |
|---|---|---|
| text-1 | #FFFFFF | primary text |
| text-2 | #C2C2C2 | header nav links |
| text-3 | #969696 | placeholders, empty states |
| text-4 | #505050 | faintest text |

### Colors — Brand + Status
| Token | Hex |
|---|---|
| brand | #00BEFF |
| error | #EB3341 |
| danger | #F77F25 |
| warning | #FFC82F |
| success | #00974F |
| info | #0180FF |
| accent-1 | #FF5D69 |
| accent-2 | #07F5AF |
| accent-3 | #04D372 |
| accent-4 | #8451F5 |

### Typography
- Font family: Inter, system-ui, -apple-system, sans-serif
- Default body weight: 300 (thin) — important
- Default body: 13px / 16px / weight 300
- Letter spacing: -0.01em to -0.03em on UI text

| Name | Size | Line height | Weight |
|---|---|---|---|
| 2xsmall | 10px | 12px | — |
| xsmall | 11px | 13px | — |
| small | 12px | 14px | — |
| default | 13px | 16px | 300 |
| large | 14px | 16px | — |
| xlarge | 16px | 20px | — |
| 2xlarge | 18px | 22px | — |
| 3xlarge | 22px | 28px | — |
| 4xlarge | 28px | 32px | — |

### Spacing + Shape
- Radius: 4px (badges) · 6px (default: buttons, cards, inputs)
  8px (larger cards) · 9999px (pills, avatars)
- Shadow: shadow-lg on hovered meeting card only
- Grid: 4px base. Common: 4, 6, 8, 12, 16, 20, 24px
- Page gutter: px-6 (24px)
- Header left padding: 24-30px

---

## Shell Layout

### Header (app/layout.tsx)
- Height: 50px, bg #212124, px-6
- Left: NoteAI logo — text "NoteAI" in #00BEFF, 140×20px slot
- Center: search pill 179×30, bg #2D2C31, radius 6px
  placeholder "Search Call Recordings" in #969696
- Right: Settings + Help links — 15px/600, #C2C2C2
  hover: text #00BEFF + bg rgba(0,190,255,0.10)
- Avatar: 32px circle, bg #4A4B4B

### Tab Bar (below header)
- Height: 50px, bg #212124, border-top 0.67px #1A1A1A
- Tabs: My Calls · Team Calls · Playlists · Alerts · Deals
- Inactive: white weight 400
- Hover: #00BEFF
- Active: #00BEFF weight 600, border-bottom 2px #00BEFF

### Custom Scrollbar
- Thumb: #4A4B4B
- Track: #1A1A1A

---

## Meeting List Page (/meetings)

### Layout
- Left: flex-1, overflow-y auto, px-6, pb-10
- Right: Ask panel — fixed 448px, border-left 2px solid #212124

### Meeting Cards
Container queries on the list column width:
- < 700px → 1 column
- ≥ 700px → 2 columns
- ≥ 950px → 3 columns
- ≥ 1200px → 4 columns

Card structure:
- Thumbnail: 16:9 (padding-top 56.25%), border 1px #26252A
  radius 6px 6px 0 0, image opacity 0.5, object-cover
- Bottom vignette: inset box-shadow rgba(0,0,0,0.8)
- Play overlay: centered 80px icon, invisible until hover
- Duration badge: bottom-right, bg rgba(0,0,0,0.5)
  13px/600 white, radius 4px, padding 1px 4px
- Caption: padding 12px 8px, radius 0 0 6px 6px
- Title: 16px/600 white, truncate
- Meta (date, participants): 12px, #818181

Card hover (200ms, cubic-bezier(0.4,0,0.2,1)):
- transform: scale(1.10)
- shadow-lg
- caption bg: #26262A
- play icon visible
- image scales to 1.15

### Ask Panel (right, 448px)
- Header: sparkle icon + "ASK" (#969696) + "NoteAI" (white bold)
- Suggested prompts: right-aligned buttons
  border 2px #212124, radius 6px, 13px/500 white, height 32px
  hover: border #343435
- Composer card: bg #212124, radius 6px, height 91px, mx-4 mb-4
- Textarea: 15px/400 white, placeholder "Ask anything…" #4A4B4B
- Scope dropdown: bg #343435, 12px, #A9A9A9, height 28px, radius 6px
- Send button: 28px circle, bg #343435, white arrow icon

---

## Meeting Detail Page (/meetings/[id])

### Layout
- Left column: flex-grow, video 16:9, min-height 250px
- Right column: 385px, hidden <1024px
  padding 20px 16px 32px, gap 20px

### Video Player
- bg #000, radius 8px 8px 0 0, margin-top 16px
- Paused overlay: rgba(0,0,0,0.75), 80px play icon (25% opacity)
- Title overlay top-left: 16px/600 white, date 12px/400 white
- Control bar (34px from bottom, px-4):
  - Volume icon (20px)
  - Time "0:00" — 13px/600 white
  - Scrubber: height 10px, radius 9999px
    bg rgba(97,97,98,0.75), fill + playhead #00BEFF
    Playhead: 3×22px vertical bar
  - Speed "1×" — 13px/600
  - Layout toggle icon

### Sub-nav Tabs (bg #000, height 47px, px-10px)
- Tabs: SUMMARY · TRANSCRIPT · ASK
- 15px/600 UPPERCASE, padding 15px 0, margin-right 15px
- Bottom rail: 2px solid #1B1B20
- Inactive: #818181 + border-bottom 2px #1B1B20
- Hover: #C2C2C2
- Active: #00BEFF + border-bottom 2px #00BEFF
- Transcript tab right: "Copy Transcript" button
  bg rgba(0,190,255,0.10), text #00BEFF 15px/600
  hover: solid #00BEFF bg, text #1D1E1F

### Transcript Panel
- bg #000, padding 0 16px
- Search: 194×33 pill, bg #1D1E1F, border 0.67px #616162
  radius 9999px, placeholder #616162
- Utterance blocks (12px vertical gap):
  - Speaker: 13px/700 #4A4B4B, right-aligned, not-italic
  - Bubble: 13px/16px/500 white
    bg rgba(74,75,75,0.5)
    radius 6px 0 6px 6px (SQUARE top-right corner)
    padding 5px 10px, width 80% (60% at md+)
    cursor pointer
  - Hover bubble: bg rgba(74,75,75,0.8)
  - Active/playing bubble: bg rgba(0,190,255,0.15)
- Resume auto-scroll pill:
  fixed bottom-center, 171×28, bg #00BEFF
  text #1D1E1F 13px/500, radius 8px 8px 0 0

### Summary Tab (bg #000, padding 20px)
- Template cards: 2-col grid, gap 8px
  each: bg #1B1B20, radius 6px, padding 12px
  name: 12px/500 #9C9C9C
  description: 11px/500 #6C6D72
  hover: bg #26252A, name white
  selected: border 1px #00BEFF

### Right Notes Column (385px, ≥1024px only)
- Title: 20px/600 white (inline rename on click)
- Date: 12px/400 #818181, 4px below title
- Share button: full width h-34px
  bg rgba(0,190,255,0.10), text #00BEFF 15px/700, radius 6px
  hover: bg #00BEFF, text #1D1E1F
- Section label "ACTION ITEMS":
  15px/700 uppercase, letter-spacing 0.375px, #616162
- Empty state: bg #212124, radius 6px, padding 16px 27px
  16px/400 italic #969696
- Action item row: checkbox 16px (checked bg #00BEFF)
  text 15px/24px/300 white, timestamp link #00BEFF

### Ask Tab (per-call)
- Input: border 0.67px #616162, radius 6px, bg transparent
  height 41px, margin 20px 15px
  placeholder "Ask NoteAI…" #4A4B4B
- Send button: 35×30, bg #00BEFF, black arrow, radius 5px
  disabled: opacity 0.5 / hover: bg #20C5FF
- Answers: 15px/24px/300 white
- Citations: #00BEFF chips, bg rgba(0,190,255,0.1), radius 4px

### Share Modal
- Overlay: rgba(0,0,0,0.6)
- Modal: bg #212124, radius 8px, width 480px, padding 24px
- Title: 18px/600 white
- Close: 24px icon #969696, hover white
- Link field: bg #1D1E1F, border 1px #343435, radius 6px, 13px
- Copy button: bg #00BEFF, text #1D1E1F, 14px/600, h-34px
- Toggles: track 32×18 (#4A4B4B / on: #00BEFF), thumb 14px white

---

## Interactive States Summary
| Element | Default | Hover | Active |
|---|---|---|---|
| Header nav link | #C2C2C2 | #00BEFF + rgba(0,190,255,.1) bg | — |
| Section tab | white 400 | #00BEFF | #00BEFF 600 + 2px underline |
| Player sub-tab | #818181 600 caps | #C2C2C2 | #00BEFF + 2px underline |
| Brand tinted button | rgba(0,190,255,.1) bg | solid #00BEFF, text #1D1E1F | — |
| Brand solid button | #00BEFF bg | #20C5FF | — |
| Secondary button | #343435 bg | bg-opacity-80 | — |
| Meeting card | flat, img 0.5 opacity | scale 1.10 + shadow-lg | — |
| Transcript bubble | rgba(74,75,75,.5) | rgba(74,75,75,.8) | rgba(0,190,255,.15) |
| Text input | transparent/#1D1E1F | — | border #00BEFF |

---

## Branding
- Product name: NoteAI
- Logo: text "NoteAI" in #00BEFF, 140×20px slot in header
- Do NOT use Fathom name, logo or wordmark anywhere