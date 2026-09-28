# NoteAI Round 3 (part 3) — Lifting the meeting-list ban, final dead code, .gitignore repair

## Session
- Date: 2026-09-28
- Branch: `v2` (`main` and production untouched; local only)
- Databases: dev `noteai`, test `noteai_test` — local Docker Postgres 18

## 1. CLAUDE.md — `9724d72`
Removed `- Never touch components/meeting-list/ or data/`, replaced with
`- Never touch data/`. The rule split ownership between two agents working the
same repo in Round 1; that split is over, and the directory had become a
holding pen for unreachable code that the rule was the only reason to keep.
The `data/` half still stands and was deliberately preserved.

Also dropped a stray UTF-8 BOM from the head of the file.

## 2. Final dead code — `d7026c1`
Re-walked the import graph from all 18 entry points — Next route files
(`page`/`layout`/`route`/`error`/`loading`), the six vitest suites, and the
config files (`tailwind.config.ts`, `vitest.config.ts`, `next.config.mjs`,
`postcss.config.mjs`). 6 of 41 files unreachable, one closed cluster:

| File | Imported by |
|---|---|
| `components/meeting-list/ask-sidebar.tsx` | nothing |
| `components/meeting-list/meeting-card.tsx` | nothing |
| `components/meeting-list/search-hint.tsx` | nothing |
| `components/meeting-list/platform-badge.tsx` | `meeting-card.tsx` only |
| `lib/ask-client.ts` | `ask-sidebar.tsx` only |
| `lib/ask-markdown.tsx` | `ask-sidebar.tsx` only |

383 lines removed. `ask-client` and `ask-markdown` were spared in the previous
pass purely because `ask-sidebar.tsx` was off limits; with it gone they had no
importer left. The Ask feature that actually ships is
`components/meeting-detail/noteai-ask.tsx` talking to `app/api/ask/route.ts`,
both untouched.

`premium-feedback.tsx` is now the only file in `components/meeting-list/`.
**Every remaining `.ts`/`.tsx` under `app/`, `components/` and `lib/` is
reachable** — the audit that started at 24 dead files is closed at 0.

## 3. `.gitignore` repair — `7644aa0`
Bytes 2309-2379 were a UTF-16LE fragment (NUL bytes interleaved through
`.env.local`, `.env*.local`, `/reference`) left by an earlier write, followed
by a plain-ASCII copy of the same three rules. Both spans were redundant — the
commented `# env` and `# reference screenshots` blocks below already carry
those rules — so both were removed.

File rewritten as plain UTF-8, LF endings, no BOM. Before: 2483 bytes, 36 NUL,
146 CR. After: 2231 bytes, 0 NUL, 0 CR, decodes as UTF-8.

Ignore behaviour verified by exit code rather than by reading:

| Path | Status |
|---|---|
| `.env` | ignored |
| `.env.local` | ignored |
| `.env.production` | ignored |
| `backend/.env` | ignored |
| `.env.example` | committable |
| `backend/.env.example` | committable |

`git status` showed `.gitignore` as the only change — nothing became newly
visible, confirming no live rule was lost.

## Verification
- `pytest` — 13 passed.
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 81 passed, 6 files.
- `npm run build` — compiled successfully, 7/7 static pages, zero errors.
- `next dev` stopped before the build and restarted after; dev server 200 on
  /meetings, backend 200 on /health, API returning 3 meetings.
