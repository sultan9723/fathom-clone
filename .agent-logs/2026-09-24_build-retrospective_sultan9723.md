# Build Retrospective — NoteAI (fathom-clone)

**What this document is:** a retrospective summary, written 2026-09-24, reconstructed
after the fact from the conversation transcript and this repository's real `git log`.
It is **not** a captured real-time log, and it does not use a log-entry format that
implies one. Where real data exists — commit timestamps — it's used verbatim
(`git log --format="%h|%ad" --date=iso-strict`, verified before writing this). Where
it doesn't exist — minute-level timing of individual prompts within a work session —
nothing is invented to fill the gap.

**What this replaces:** `.agent-logs/2026-09-23_19-00-00_sultan9723.md`, which
presented itself as an automated capture but wasn't one. See `CAPTURE-TEST.md` for
what that file actually looked like and why it didn't hold up.

**Model:** Claude Opus 5 for the initial build (scaffold review through the raw
design-token-values commit, `c586faf`). The session then switched to Claude Sonnet 5
via an explicit `/model` command, before the SPEC.md design-system rewrite, and
Sonnet 5 handled everything from `6280e44` onward — including this document. Not
"claude-sonnet-4-6"; that string only appears inside this app's own `ClaudeProvider`
code as an Anthropic model ID choice for the Ask feature, unrelated to which model
did the coding.

**Scope note:** several commits in this repo's history don't correspond to any turn
visible in this conversation — most notably `b132813` (which introduced
`.claude/settings.json`, `scripts/capture-log.js`, and `CAPTURE-TEST.md` alongside
seed-data files that *were* written in this conversation), and later `ffc079b`,
`71df1a7`, `c9b8c0e`, `b5b4544`, `c177c54`. Something else was also committing to
this branch during the session; those aren't attributed to this conversation below.

---

## 1. Initial scaffold

Pre-existing when this conversation started — already committed (`0cf75c1` through
`a9ea717`, 2026-09-23 13:08–18:22) and visible as history in the first turn's git
status. Next.js 15 + TypeScript + Tailwind + shadcn/ui, CI workflow, `lib/types.ts`.
Not built in this conversation — read as the starting point.

## 2. Seed data

Written 2026-09-23, landed in `b132813` alongside files this conversation didn't
write (see scope note). Five meetings in `data/meetings/*.json` — Q3 roadmap review,
Acme discovery call, Sprint 24 retro, Series A pitch dry run, Northwind onboarding
kickoff — each with 37–46 transcript lines, 3–5 participants, action items,
highlights, and a precomputed summary. Validated programmatically for referential
integrity: every `speakerId` resolves to a real participant, every timestamp falls
inside the meeting's duration, transcripts are start-time sorted.

## 3. Repository + AI layer

`b849884`, `9c629c3` — 2026-09-23 18:46–19:03.

`MeetingRepository` interface + `JsonMeetingRepository` (`lib/repository.ts`) as the
seam between UI and storage. `AIProvider` interface with `MockProvider` — BM25
retrieval over the transcript, no API key required — and `ClaudeProvider`; the
`/api/ask` route. The mock provider was built as a genuine fallback, not a stub: with
no key configured it still quotes the relevant transcript lines directly rather than
failing.

## 4. Dark theme design tokens

`c586faf`, `7775395` — 2026-09-23 22:23 and 23:23.

`lib/design-tokens.ts` as the single source of color, type, and sizing;
`tailwind.config.ts` derives every utility from it. Two passes: the first
(`c586faf`, still on Opus 5) took exact hex/px values from a supplied spec. The
second (`7775395`, after the switch to Sonnet 5) added the remaining tokens the full
component rebuild needed — search-pill color, notes-column width, and so on — and
added the `@tailwindcss/container-queries` plugin.

## 5. Meeting list UI

`1ce3082` — 2026-09-23 23:31.

Card grid with container-query breakpoints (1/2/3/4 columns keyed to the list
column's own width rather than the viewport, since a fixed 448px Ask sidebar sits
beside it — this was verified to matter, not assumed: measuring the column's actual
width against where a viewport-based `lg:` breakpoint would fire showed they
disagreed). Ask sidebar wired to a real meeting-scoped `/api/ask` call through a
scope dropdown, not decorative.

## 6. Meeting detail UI

`d7738e7`, `1e22b37`, `1103003`, `c9a5339` — 2026-09-23 23:38–23:45.

Restructured from a single stacked-panels page into a persistent video player above
a Summary/Transcript/Ask tab switcher, plus a Notes column. The transcript panel's
"follow playback" checkbox became a resume-auto-scroll pill that only appears once
the user has actually scrolled away from the live line. Share modal got a real
`role="switch"` toggle in place of a native checkbox.

## 7. Cross-meeting search

`b9a1c8d` — 2026-09-24 11:17.

`lib/search.ts` — case-insensitive substring search across every meeting's
transcript, a highlighted snippet per hit, results grouped by meeting — plus the
`/search` page. `MeetingRepository` gained `getAll()`. 13 new tests, one of them
running against the real seed data rather than a fixture. Verified live: searching
"reporting" returned 13 results across 3 meetings; clicking a result opened the
correct meeting and seeked the video to the exact matching second.

## 8. Groq AI provider

`9857dc7` — 2026-09-24 12:09. (Later model-name corrections, `71df1a7` and
`c9b8c0e`, fall outside this conversation's visibility — see scope note.)

Added alongside a Gemini provider that went through several model-name corrections
in this conversation, after the originally-specified `gemini-2.0-flash` and later
`gemini-pro` both 404'd (`e29d390`, `5f26fa4`, `a74a503`). The Groq addition fixed a
real bug in the code it was specified from: the given snippet set
`readonly name = 'openai' as const` on the new `GroqProvider`, which would have
mislabeled every Groq-sourced answer as OpenAI in the UI. Named it `'groq'` instead
and extended the `provider` union type to match.

## 9. Bug fixes (mobile, Ask panel, etc.)

`5df9eda` through `02d1c78` — 2026-09-24 00:34–01:04, ten commits across roughly 30
minutes.

Mobile horizontal scroll (missing `min-w-0` on flex children was forcing the header
wider than the viewport), a Details tab so the Notes column's content is reachable
below the 1024px breakpoint, real `<a>` tags for four nav items that were inert
`<span>`s, Ask sidebar `position: sticky` (it had no height of its own, so it
stretched to match a 1009px-tall sibling and pushed its own composer off-screen), a
Share-modal toggle-knob overflow traced to a missing `left` value on the
absolutely-positioned thumb rather than the translate value the original bug report
named, input font sizes raised to stop iOS Safari's zoom-on-focus (catching along the
way that this project's `text-base` utility is remapped to 13px, not Tailwind's
standard 16px — applying the literal instruction as given would not have fixed the
bug), and avatar initials in place of an empty circle.

## 10. CI/CD setup

Not built in a turn visible in this conversation. `.github/workflows/ci.yml` and
`secrets.yml` existed before the first turn and were modified several times across
the session (`f822105`, `3a4c391`, `1f2036b`, `fb23ec3`) by a mix of edits made in
this conversation and changes that appeared on disk without a corresponding request
— noted at the time, in at least one commit message (`fb23ec3`), as changes "picked
up alongside" work that was actually asked for.

---

## Honest gaps

- No per-prompt timestamps exist below commit granularity. How long any individual
  exchange took isn't known, and no numbers are invented to fill that in.
- Several commits (listed in the scope note above) can't be traced to a specific
  request in this conversation.
- This document was written by the same assistant whose work it describes, working
  from the same conversation and this repo's own git history. It is not an
  independently audited record.
