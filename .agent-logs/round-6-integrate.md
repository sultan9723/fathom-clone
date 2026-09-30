# NoteAI Round 6 — Integrate: rewire, delete, and make the honest version

## Session
- Date: 2026-09-28
- Branch: `v2-integrate` (from the `51e4f6a` Codex snapshot). `main` untouched.
- Local Docker Postgres only. No production access.
- Untouched by agreement: `app/(marketing)/**`, `components/marketing/**`.

## 1. Rewire before deleting — `baa7b97`
`components/product/meeting-tools.tsx` worked against the real API but was
imported only by `components/product/meeting-detail.tsx`, which no route
renders, so none of it reached a user. Ported to
`components/meeting-detail/meeting-tools.tsx` on the DESIGN.md primitives
(Panel, Button, token scale) rather than `product.css`.

- **Export** — JSON of the loaded meeting, transcript, action items and
  summary, with `summary_persisted: false` recorded because the summary is
  generated per session and never stored.
- **Share recap** — clipboard, falling back to a selectable textarea when the
  clipboard is refused (no gesture, http, or permission).
- Both disabled until the transcript loads; exporting a half-loaded meeting
  would silently write a file missing most of it.
- **Edit** — `PUT /v1/meetings/{id}`.
- **Delete** — confirms first, naming the meeting and listing what goes with
  it, then `DELETE /v1/meetings/{id}` and back to the list.

`updateMeeting` / `deleteMeeting` added to `lib/api.ts`. The summary lifted to
the page so Export and Share can include it (`SummaryPanel.onSummaryChange`).
An `inFlight` ref guards double submits — `busy` alone is async and lets a
fast second click through.

## 2. Deletions, one commit per group, build after each
**`211d8ad`** — `components/product/{meeting-detail,meeting-transcript,
meeting-intelligence,evidence,meeting-library,meeting-tools}.tsx`.
Unreachable duplicates of shipped pages.

**`72eefa8`** — the Round 1 views: `noteai-*.tsx` (6), `player-provider.tsx`,
`premium-feedback.tsx`, `search-page-input.tsx`,
`app/components/meeting-detail/`, plus `tests/video-player.test.ts` whose only
subject was the deleted `recording-embed`. **1,516 lines.** This removed every
remaining DESIGN.md violation in the tree — the gradients and box-shadows
lived only here, as did every use of the legacy Tailwind shim.

**`ac0de7c`** — the demo-data layer. `app/api/ask/route.ts` answered about
five hardcoded meetings in `data/meetings/` that do not exist in the database;
no component called it, yet it built into every deploy and was publicly
callable. Removed with `lib/repository.ts`, `lib/ai/`, `lib/search.ts`,
`lib/transcript.ts` and their four test files (50 tests of demo-data plumbing;
the behaviour that matters is the backend's, covered by pytest).
`next.config.mjs` loses its `outputFileTracingIncludes` for `data/meetings`.

`tsc` caught the dangling `recording-embed` import the moment that file went —
which is why this relied on tsc and build after each group rather than a regex
scan, as instructed.

**CLAUDE.md** — "Never touch data/" is gone with the directory. The ownership
list named files that no longer exist; it now describes the tree as it stands,
records that Codex owns the marketing and product directories, restates where
the API key actually lives, and adds a rule that app data comes from the
backend only.

## 3. Legacy Tailwind shim — `5509229`
Both blocks removed: the colour aliases (`bg-page`, `text-fg-*`, `border-line`,
`brand`, `surface-1/4`, `search-pill`) and the legacy font sizes. A grep for
every one of those names across `app/`, `components/` and `lib/` returns
nothing, so nothing needed migrating — the files that used them were deleted
or rewritten first. Verified beyond a green build: the emitted CSS still
carries `--accent:#4ade80` and the `bg-accent` / `text-text` utilities.

## 4. Buttons that do nothing — `c05cb45`
- `components/meetings/add-meeting-bar.tsx` replaces `join-bar.tsx`: one
  sentence that live joining is coming next, and an **Add a meeting** link to
  `/meetings/new`, which genuinely imports a transcript.
- `app/(app)/join/page.tsx` drops the link field, Join, Upload and the
  platform toggles; it leads with the import route and states plainly that
  nothing on the page records a meeting.
- Sidebar primary button now reads **Add a meeting**.

`components/product/join-form.tsx` stays — `app/(marketing)/page.tsx` still
uses it and that file is Codex's. **Flagged:** the landing hero therefore
still shows a Join/Upload form that the app no longer offers.

## 5. One API base URL — `4289da4`
`lib/api-base.ts` decides it once. `lib/api.ts` had defaulted to
`http://localhost:3000/api` — the Next app itself — so a deploy with
`NEXT_PUBLIC_API_URL` unset answered 404 to every call instead of failing
visibly; `lib/product-api.ts` defaulted to `:8000`. Now: `:8000` in
development, and in production an unset variable **throws** a message naming
the variable and the expected shape. Resolved per call, not at module load, so
it does not throw during a production build where the variable legitimately
may be absent. Blank counts as unset; a trailing slash is trimmed. 5 tests.

## 6. render.yaml — `f76f92a`
- `startCommand` was `uvicorn backend.main:app` from the repo root, which
  cannot work: `backend/main.py` imports its siblings flatly. Now
  `rootDir: backend` + `uvicorn main:app`, verified by importing `main` from
  `backend/` and getting a FastAPI app back.
- `DATABASE_URL` was pinned to SQLite — actively lossy on Render, whose disk
  is not persistent across deploys. Now from the environment (`sync: false`).
- `ANTHROPIC_API_KEY: sk-test` placeholder removed; `GROQ_API_KEY` (what the
  backend actually prefers) declared `sync: false`.
- `CORS_ORIGINS` added — the backend defaults to localhost only, so a deployed
  frontend is refused without it.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 46 passed, 7 files. (Down from 120/12: 50 demo-data
  tests and 24 recording-embed tests were deleted with their subjects; 5
  api-base tests added.)
- `npm run build` — compiled clean, 10 routes. `/api/ask` gone from the table.
- `pytest` — 29 passed.
- Browser at 1440px: list shows 3 real meetings with no Join button and the
  renamed sidebar; detail shows the new "This meeting" panel; Delete opens a
  confirmation naming the meeting. **Not confirmed** — that would destroy real
  data.
- Browser at 375px (375px same-origin iframe; Chrome clamps its window at
  1280): list and detail both `scrollWidth === clientWidth`, tools panel wraps
  to two rows.

## Notes
- A stale dev server on port 3000 was serving deleted code and returning 500s;
  a fresh one started on 3001, where the list showed its error state because
  the backend's `CORS_ORIGINS` allows `localhost:3000` only. Killing the stale
  process and restarting on 3000 resolved both. The error state rendering
  correctly under a real CORS rejection was an unplanned but useful check.
- `tests/api-base.test.ts` initially assigned `process.env.NODE_ENV` directly,
  which is readonly in the TS types. It passed under vitest and slipped into
  `4289da4` because `next build` does not typecheck `tests/`; fixed with
  `vi.stubEnv` in `baa7b97`.
