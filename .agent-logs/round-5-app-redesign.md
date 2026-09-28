# NoteAI Round 5 — App redesign on real data + batch translation

## Session
- Date: 2026-09-28
- Branch: `v2` (`main` untouched)
- Databases: dev `noteai`, test `noteai_test` — local Docker Postgres 18. Render never touched.
- Source of truth: `DESIGN.md`

## 3. Backend — batch translation — `28f691b`
`POST /api/v1/meetings/{id}/translations?lang=xx` translates every uncached
line in one provider call and stores the result. New table
`transcript_translations (meeting_id, line_id, lang, text)` with a unique
constraint on `(line_id, lang)` — that constraint is what makes the write
safe under concurrent requests; the loser rolls back and reads the winner's
rows rather than failing the caller.

Unlike `/api/v1/ai/translate`, which degrades to HTTP 200 with the failure in
the body, this returns real statuses so the UI can tell failure from success:
**502** provider failure, **503** not configured, **400** unsupported language
(rejected before any call, so a typo can't spend one). Provider errors quote
the API key back, so only the exception type is logged and none of it reaches
the client. A reply not covering every line is a 502, not a partial result —
attaching translations to the wrong lines is worse than showing the original.

16 pytest cases: cache miss (one call, rows written), cache hit (no call),
per-language isolation, translating only lines added since, failure, key
redaction, incomplete replies, retry, and validation. They call the handler
directly — installed httpx 0.28 dropped the `app=` shortcut starlette 0.27's
TestClient needs, and pinning it would change a package in the shared
environment; `HTTPException` carries the same status and detail, and a
registration test covers the wiring.

Live against local Postgres with real Groq calls: fresh ~2.6s, cached ~0.2s,
correct output in Spanish, Urdu and Chinese. The dedupe script now counts and
removes cached translations too.

## 1, 2, 4, 5. Frontend — `46a6ce2`, `d8c7c3f`, `00f00ae`
Both pages read the API only — no seed meetings, no demo transcript, no
invented summary.

**List** — `JoinBar` (submitting says "Joining meetings is coming next." and
names the platform it recognised; no Upload, since it doesn't exist yet);
All / This week as a SegmentedControl composed over search results; a real
table (title + description, languages, speakers, length, date) that stacks
into a card per row below md while staying a `<table>` so the header keeps
naming cells; debounced search with the out-of-order guard; skeleton in the
table's own shape, a three-way empty state, and an error with retry.

**Detail** — `SpeakerTimeline` derives turns from timestamps alone;
`TranscriptPanel` carries "Read in" (EN / اردو / 中文 / ES), fetching the whole
transcript in one call and showing the translation *beside* the original,
never instead of it, with "Showing the original for now" + Retry on failure;
summary stays honestly empty until generated; action items toggle
optimistically against the existing PATCH and roll back on failure. The
chosen language lives on the page so summary and Ask answer in it too.

**Motion** — `lib/scramble.ts` resolves text out of noise drawn from the
target script (not Latin), whitespace never scrambles so lines can't reflow,
and `prefers-reduced-motion` skips it entirely.

### Three bugs found by running it, not by reading it
- **Timeline stretched the last speaker across silence** (`d8c7c3f`). A turn
  ran to the next line, and the final line ran to the meeting duration — the
  seeded transcripts stop ~3 min into a 30 min meeting, so one bar covered
  90% of the timeline. The final turn now takes the median inter-line gap.
- **Summary rendered English as RTL** (`00f00ae`). It used the *currently
  selected* language for direction, so switching the transcript to اردو
  flipped an English summary right-aligned. It now records the language the
  text was actually written in.
- **Scramble resolved RTL backwards** (`00f00ae`). Index 0 is where reading
  begins in every script — it merely renders rightmost in RTL — so the RTL
  inversion made Urdu settle from the end of the sentence backwards.

## Verification
- `pytest` — 29 passed.
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 115 passed, 11 files (+9 timeline, +7 scramble).
- `npm run build` — compiled successfully, zero errors.
- Browser at 1440px: list shows all five columns and 3 real meetings; detail
  shows the timeline, transcript, and a live Urdu translation side by side
  with the English original.
- Browser at 375px: rendered in a 375px same-origin iframe, because Chrome
  clamps its window at 1280. Rows stack with inline metadata, the join bar
  and filters stack, the Read-in control wraps, and `scrollWidth ===
  clientWidth` on both pages — no horizontal overflow.

## Concurrent agent — important
Another agent (Codex) worked in this same tree throughout, building a
parallel implementation: `components/product/`, `lib/product.ts`,
`lib/product-api.ts`, `app/(app)/join/`, `settings/`, `action-items/`,
`meetings/new/`, `app/(marketing)/sign-in/`, plus rewrites of
`components/layout/sidebar.tsx` and `app/(app)/layout.tsx` — files this
session authored in Round 4.

Only files authored here were staged; none of that work was committed, moved
or reverted. It remains uncommitted in the working tree for its author. One
consequence: the browser verification above ran inside Codex's uncommitted
app shell (its sidebar shows "Action items" and "Settings" nav items that
this session's sidebar does not), and the build's route table lists its
routes. The pages verified are this session's.

`components/meeting-list/premium-feedback.tsx`, `noteai-*.tsx` and
`app/components/meeting-detail/` are now unreferenced by these pages but were
left in place: the import graph is being rewritten by both agents at once,
and deleting on that basis right now would be unsafe.
