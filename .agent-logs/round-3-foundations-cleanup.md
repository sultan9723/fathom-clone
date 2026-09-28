# NoteAI Round 3 — Foundations Cleanup

## Session
- Date: 2026-09-28
- Branch: `v2` (branched from `main` @ c27ac64; `main` untouched)
- Database: LOCAL Postgres 18 via Docker (`noteai-dev-db`), `postgresql://noteai:***@localhost:5432/noteai`
- Production (Render) was never connected to or modified.
- Scope: the five numbered foundations tasks only.

## Problem
Production had every seed meeting duplicated. Root cause: two seed paths ran
against the same database — `seed_if_empty()` on app startup and a manual seed
script — and the only guard was "is the meetings table empty", which neither
path could rely on once the other had run. A frontend workaround (collapse the
list by normalized title) hid the symptom in the UI without fixing the data.

## Changes

### 1. Idempotent seeding — `dad7423`
`backend/seed.py`: new `seed_meetings(db)` checks each seed title against the
meetings table and inserts only what is missing, returning the titles it
inserted. `seed_if_empty(db)` keeps its startup contract (no-op on a non-empty
table) and delegates. Also guards against a duplicate title inside `_MEETINGS`.

Verified: three consecutive `seed_meetings()` runs on the populated local DB
inserted nothing and left the count at 3.

### 2. Dedupe script — `ece399b`
New `backend/scripts/dedupe_meetings.py`. Groups meetings by title, keeps the
oldest per title (`created_at`, then `id` as a stable tie-break), deletes the
rest with their transcripts, action items and notes. Reads `DATABASE_URL` from
the environment via `database.py`.

- Dry run is the default and writes nothing; `--apply` is required to delete.
- `--apply` refuses a non-local host (exit 2) unless `--allow-remote` is given,
  so it cannot hit production by accident. Passwords are masked in output.

Verified on local Postgres: seeded to 9 meetings (3 titles x 3), dry run
reported 6 deletions and changed nothing (count still 9), `--apply` removed
38 transcripts + 6 action items + 6 meetings leaving exactly 3 meetings with
their original 19 transcripts, and a re-run reported nothing to do. The remote
guard was confirmed to refuse a Render-shaped URL.

### 3. Frontend dedup hack removed — `6867ece`
`app/meetings/page.tsx`: dropped the `uniqueMeetings` collapse-on-title pass
added in c27ac64. The grid renders exactly what the API returns, so two
genuinely distinct meetings sharing a title no longer silently disappear.

### 4. Stale references — `cab9720`
Full match list for "My Calls", "Team Calls", "Playlists", "Alerts", "Deals":

| Location | Match | Action |
|---|---|---|
| `app/meetings/[id]/page.tsx:198` | back-link "All meetings" | renamed "Meetings" |
| `components/meeting-detail/meeting-detail.tsx:39` | back-link "My Calls" | renamed "Meetings" |
| `app/alerts/page.tsx` | ComingSoon route | deleted |
| `app/deals/page.tsx` | ComingSoon route | deleted |
| `app/playlists/page.tsx` | ComingSoon route | deleted |
| `components/layout/coming-soon.tsx` | component + comment | deleted |
| `SPEC-ROUND1-FATHOM.md:190` | tab list | kept (historical spec) |

The three ComingSoon routes were unreachable after c27ac64 reduced the nav to
a single Meetings tab; `coming-soon.tsx` had no other importer. `/search` was
kept — `components/layout/header-search.tsx` still routes to it.

Note: `components/meeting-detail/meeting-detail.tsx` is exported but imported
nowhere — the live detail view is `app/meetings/[id]/page.tsx`. Both were
renamed; the dead component was not deleted, as that is outside this scope.

### 5. Counters — `69c2a51`
`app/meetings/page.tsx`: "Searching across N meetings" read a count cached from
a separate `getMeetings()` call on mount, which the filters never touched, so
it claimed a corpus the page wasn't showing. Both counters now run through one
`matchesFilters` predicate — the results counter counts exactly the rendered
rows, the corpus counter is the full library under the same filters. The mount
fetch keeps the list instead of just its length and refetches on retry.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run build` — compiled successfully, zero errors; route table no longer
  lists /alerts, /deals, /playlists.
- `npm run test:run` — 81 tests across 6 files, all passing.
- `pytest` (backend) — **no suite exists**: 0 items collected, exit 5. Backend
  behaviour was verified live against local Postgres instead (see tasks 1-2).
- Browser, localhost:3000: /meetings shows exactly 3 meetings; search "atlas"
  gives "2 results" + 2 cards, "roadmap" gives "1 result" + 1 card; the status
  line was captured mid-search reading "Searching across 3 meetings…"; a
  duration filter narrowed both counters consistently; the detail page opens
  and its back-link reads "Meetings".

## Notes
- `npm run build` and `next dev` share `.next`; running the build broke the
  already-running dev server twice. Restarted it both times; it is running.
- `backend/.env` still has `DATABASE_URL=sqlite:///./noteai.db`. Left as-is —
  outside this scope. Local Postgres was passed per-command for all testing,
  and the running backend on :8000 is already pointed at local Postgres.
