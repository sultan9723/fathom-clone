# v3 UX fixes — review report

Implemented on `v3-ux-fixes`, starting from the fetched, verified `origin/main` commit `fd232dbe07125259b179f8d2e0e335512527c3eb`. The starting checkout was clean. One atomic commit is retained for each numbered issue, with separate verification/error-handling and report commits.

No main checkout, main commit, merge, PR, deployment, or production data mutation was performed. The sole push target is `origin v3-ux-fixes`. Local `main` remains at the verified base. The final conversation response records the completed push result.

## Results

- `npm run build`: passed.
- `npx tsc --noEmit`: passed, no stdout/stderr.
- `npm run test:run`: 65 passed across 9 files.
- `python -m pytest` in backend/: 98 passed.
- Browser: passed against the production Next build, including an actual resize from 1440px to 375px and real backend 429/503 responses in Summary, Ask, and transcript translation.

On Windows, npm.cmd/npx.cmd invoke the requested commands because the PowerShell wrapper is blocked by the host execution policy. The local browser build used NEXT_PUBLIC_API_URL=http://localhost:8013/api. No environment file was changed or committed.

## Judgments and limitations for review

1. **Search scope:** the meeting-list input now filters loaded metadata locally. Full-text transcript search remains available through an explicit link to /search. The list no longer substitutes asynchronous server search results for its source data.
2. **Source data repair:** the live API returned six distinct IDs (two of each seed title). The three newer rows each contained one transcript line with null speaker_name/original_language. Direct SQL against the configured local PostgreSQL database found three old seeds with only 6/7/6 lines, and engineering had four speakers despite advertising five. Production SQL credentials were not available; direct production database inspection remains unverified. Read-only live API inspection established that the malformed/duplicate data is returned by the backend, not invented by rendering.
3. **Repair boundaries:** exact known metadata/transcript fingerprints are repaired on backend startup. The oldest matching ID survives; attached notes/tasks are retained; stale translations are invalidated. Same-title or edited meetings are preserved. No production repair or deployment was run in this session. The CLI supports a dry run before a later authorized deployment.
4. **Speaker visualization:** one bar per speaker shows estimated participation inferred from line timestamps. The schema has no audio-derived speaker end times. The UI labels this estimate explicitly.
5. **Language copy:** chose English-only Summarize/Regenerate labels consistently, leaving output-language choice to the active tab.
6. **Drawer:** uses native dialog modality for background inertness plus explicit Tab wrapping and focus restoration. Reduced motion removes the slide transition.
7. **Verification boundaries:** successful provider responses were controlled browser fixtures to exercise Markdown/RTL/XSS and a 2.6s translation cache miss. The fixtures were removed for real 429/503 checks, which ran through unchanged FastAPI rate-limit and budget enforcement with a zero local budget. No external provider calls were made by those failure tests.
8. **Existing warnings:** build reports missing Next ESLint plugin configuration; Vitest reports the Vite CJS deprecation; pytest reports a python_multipart deprecation. Dependency installation reported 13 advisories; unrelated dependency upgrades were outside this task.

## File-by-file changes

| File | Change |
| --- | --- |
| `.agent-logs/v3-ux-fixes.md` | Session chronology, database findings, verification details, judgments, limitations, and branch restrictions. |
| `app/(app)/join/page.tsx` | American spelling: summarized. |
| `app/(app)/meetings/page.tsx` | Full-width mobile search and filters below; fetch list independently of query; 150ms debounce; derived metadata filtering; immediate clear including date filter; explicit full-transcript search link. |
| `app/(marketing)/landing.css` | Import CTA layout, prominent preview disclosure, and overlay-menu visibility rules. |
| `app/(marketing)/page.tsx` | Import-first hero/metadata/final CTA; join and upload preview moved to lower Coming soon section. |
| `app/globals.css` | Readable Markdown styles for lists, headings, links, code and tables; six speaker colors. |
| `backend/main.py` | Document the startup repair behavior of the existing seed hook. |
| `backend/scripts/repair_demo_meetings.py` | Exact-fingerprint repair CLI; dry run by default, explicit --apply for a transaction commit. |
| `backend/seed.py` | Versioned seed loading; exact legacy fingerprint repair; deterministic new IDs; serialized PostgreSQL seeding; preserve oldest matching meeting IDs and user notes/action items; invalidate obsolete translations; leave user-edited records untouched. |
| `backend/seed_data.json` | Three distinct authored discussions with 32/36/28 turns, 4/5/3 named speakers, and 30/45/20-minute timestamp coverage. |
| `backend/seed_legacy.json` | Original seed snapshots used only to recognize exact legacy data safely. |
| `backend/tests/test_seed.py` | Validate realistic metadata/transcripts, dry-run behavior, duplicate repair, retention of IDs/user work, cache invalidation, and preservation of edited records. |
| `components/layout/navigation-drawer.css` | Fixed lighter drawer, translucent backdrop, translateX with 200ms ease-out, 44px close target, reduced-motion override. |
| `components/layout/navigation-drawer.tsx` | Native modal dialog with real close icon, Escape/outside-click dismissal, focus trap/restoration, scroll locking, resize closure, and enter transition. |
| `components/layout/sidebar.tsx` | App mobile navigation uses the overlay drawer; desktop sidebar remains available. |
| `components/marketing/header.tsx` | Import CTA and landing mobile navigation drawer. |
| `components/meeting-detail/ask-panel.tsx` | Render answers as sanitized Markdown inside persistent polite live regions; preserve answer language and direction. |
| `components/meeting-detail/speaker-timeline.tsx` | One proportional colored participation bar per speaker, based on transcript turns; disclose the estimate. |
| `components/meeting-detail/summary-panel.tsx` | Summary and Regenerate share sanitized Markdown and a polite live region; English-only Summarize labels; Writing feedback during regeneration. |
| `components/meeting-detail/transcript-panel.tsx` | Dedicated mobile language row; hide Read in on mobile; immediate per-language busy state; avoid reselecting the current tab; six matching speaker colors. |
| `components/meeting-detail/transcript.css` | Enforce 44×44px minimum language targets and nonwrapping individual labels. |
| `components/meetings/meetings-table.tsx` | Semantic title/date/duration cards below 640px; table at larger widths; hide mobile language/speaker columns. |
| `components/product/join-form.tsx` | Use body font for meeting-link input and placeholder. |
| `components/ui/markdown.tsx` | Shared marked parser followed by DOMPurify with a document-markup allowlist; no untrusted HTML inserted before sanitization. |
| `components/ui/panel.tsx` | Forward native HTML attributes so named Summary/Ask/Transcript sections retain aria-labelledby. |
| `components/ui/segmented-control.tsx` | Wrapping control group, nonwrapping labels, 44px height, optional per-option loading dot and aria-busy. |
| `lib/ai-error.ts` | Safe, actionable 429 and daily-budget 503 messages without provider diagnostics. |
| `lib/api.ts` | Apply shared quota error messages to Ask and translation calls. |
| `lib/meeting-filter.ts` | Pure case-insensitive literal metadata filter with empty-query reset. |
| `lib/product-api.ts` | Apply the same AI quota error messages in the alternate API client. |
| `package-lock.json` | Lock marked, DOMPurify, and Playwright plus their required dependencies; no unrelated upgrades. |
| `package.json` | Add marked and DOMPurify runtime dependencies; Playwright dev dependency for reproducible browser tests. |
| `tailwind.config.ts` | Expose speaker colors four through six. |
| `tests/api-errors.test.ts` | American spelling in fixtures and assertions for safe, actionable 429/503 errors. |
| `tests/meeting-filter.test.ts` | Metadata, case, whitespace, multilingual, literal punctuation and reset behavior. |
| `tests/v3-ux.browser.cjs` | Chromium regression suite: real database reads, viewport resize to 375px, search race/clear, tabs/loading, Markdown/XSS/RTL/regenerate, both drawers, homepage and actual backend 429/503 responses. |
| `.agent-logs/v3-verification/browser.txt` | Full command output (empty means no output for successful typecheck). |
| `.agent-logs/v3-verification/build.txt` | Full command output (empty means no output for successful typecheck). |
| `.agent-logs/v3-verification/hero-375.png` | 375px browser verification screenshot. |
| `.agent-logs/v3-verification/homepage-375.png` | 375px browser verification screenshot. |
| `.agent-logs/v3-verification/meetings-375.png` | 375px browser verification screenshot. |
| `.agent-logs/v3-verification/pytest.txt` | Full command output (empty means no output for successful typecheck). |
| `.agent-logs/v3-verification/real-limit-messages-375.png` | 375px browser verification screenshot. |
| `.agent-logs/v3-verification/transcript-375.png` | 375px browser verification screenshot. |
| `.agent-logs/v3-verification/transcript-top-375.png` | 375px browser verification screenshot. |
| `.agent-logs/v3-verification/typecheck.txt` | Full command output (empty means no output for successful typecheck). |
| `.agent-logs/v3-verification/vitest.txt` | Full command output (empty means no output for successful typecheck). |
| `.agent-logs/v3-report.md` | This complete review report, including verification output and review judgments. |

## Full verification output

Each command below exited 0. Raw files are retained alongside this report. ANSI color escapes are omitted below; all output lines are retained.

### npm run build

```text

> fathom-clone@0.1.0 build
> next build

   ▲ Next.js 15.5.26
   - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully in 4.7s
   Linting and checking validity of types ...

 ⚠ The Next.js plugin was not detected in your ESLint configuration. See https://nextjs.org/docs/app/api-reference/config/eslint#migrating-existing-config
   Collecting page data ...
   Generating static pages (0/11) ...
   Generating static pages (2/11) 
   Generating static pages (5/11) 
   Generating static pages (8/11) 
 ✓ Generating static pages (11/11)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                    6.81 kB         123 kB
├ ○ /_not-found                            992 B         104 kB
├ ○ /action-items                        3.83 kB         120 kB
├ ○ /join                                1.45 kB         114 kB
├ ○ /meetings                            3.88 kB         120 kB
├ ƒ /meetings/[id]                       32.2 kB         148 kB
├ ○ /meetings/new                        2.86 kB         119 kB
├ ƒ /search                               1.4 kB         118 kB
├ ○ /settings                            1.78 kB         115 kB
└ ○ /sign-in                             1.47 kB         114 kB
+ First Load JS shared by all             103 kB
  ├ chunks/255-2dbbf79f36f0dfa2.js       46.4 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)          2.04 kB


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### npx tsc --noEmit

No stdout or stderr. Exit code: 0.

### npm run test:run

```text

> fathom-clone@0.1.0 test:run
> vitest --run

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.

 RUN  v2.1.9 F:/fathom-clone-1

 ✓ tests/i18n-text.test.ts (9 tests) 11ms
 ✓ tests/api-base.test.ts (5 tests) 78ms
 ✓ tests/marketing-demo.test.ts (13 tests) 13ms
 ✓ tests/motion.test.ts (7 tests) 10ms
 ✓ tests/scramble.test.ts (7 tests) 11ms
 ✓ tests/api-errors.test.ts (10 tests) 33ms
 ✓ tests/speaker-timeline.test.ts (9 tests) 20ms
 ✓ tests/meeting-filter.test.ts (3 tests) 16ms
 ✓ tests/next-config.test.ts (2 tests) 14ms

 Test Files  9 passed (9)
      Tests  65 passed (65)
   Start at  15:59:47
   Duration  2.58s (transform 1.07s, setup 0ms, collect 1.78s, tests 205ms, environment 4ms, prepare 4.03s)
```

### python -m pytest (backend/)

```text
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.0.3, pluggy-1.6.0
rootdir: F:\fathom-clone-1\backend
configfile: pytest.ini
testpaths: tests
plugins: anyio-3.7.1, langsmith-0.9.3, asyncio-1.4.0, cov-7.1.0, timeout-2.4.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collected 98 items

tests\test_budget.py ..................                                  [ 18%]
tests\test_cors.py ..................                                    [ 36%]
tests\test_dedupe_meetings.py .......                                    [ 43%]
tests\test_input_limits.py ...............                               [ 59%]
tests\test_ratelimit.py ..............                                   [ 73%]
tests\test_seed.py .........                                             [ 82%]
tests\test_translations.py .................                             [100%]

============================== warnings summary ===============================
C:\Users\DELL\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\formparsers.py:10
  C:\Users\DELL\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\formparsers.py:10: PendingDeprecationWarning: Please use `import python_multipart` instead.
    import multipart

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================= 98 passed, 1 warning in 17.34s ========================
```

### node tests/v3-ux.browser.cjs

```text
Real database API: 3 unique demos; 28/32/36 named transcript turns spanning 20/30/45 minutes.
375px meetings: cards, title/date/duration, full-width search, pills below, no overflow; rapid typing/clear passed.
375px transcript: separate language row, 44×44 targets, nonwrapping Chinese, proportional colored speaker bars. 2.6s cache-miss loading dot verified.
Browser Markdown: English/Urdu/Chinese/Spanish, Summary/Regenerate/Ask; unsafe scripts/images/javascript URLs removed; polite live regions and RTL retained.
REAL backend Summary 503: The daily limit for AI requests has been reached. Translations and summaries will be available again tomorrow.; UI: The daily AI limit has been reached. Translations, summaries, and answers will be available again tomorrow.
REAL backend Summary 429: Too many requests. You have reached the limit for AI requests — please wait a moment and try again.; UI: Too many AI requests. Please wait a moment and try again.
REAL backend Ask 503: friendly message displayed.
REAL backend Ask 429: friendly message displayed.
REAL backend Translation 503: friendly message displayed; original transcript retained.
REAL backend Translation 429: friendly message displayed; original transcript retained.
Homepage: import-first hero, prominent Coming soon preview, body-font input. Both navigation drawers overlay, trap/restore focus, close on backdrop/Escape, and lock scroll.
PASS: v3 browser regression suite; no unhandled browser exceptions.
```

## Reproduce the real failure checks

Use a disposable local database and a separate port; never use production for this test.

Backend environment: DATABASE_URL points to a disposable SQLite file; GROQ_DAILY_CALL_BUDGET=0; RATE_LIMIT_AI=1/hour; RATE_LIMIT_TRANSLATIONS=1/hour; GROQ_API_KEY=local-test-never-sent; OPENAI_API_KEY and ANTHROPIC_API_KEY empty; CORS_ORIGINS=http://localhost:3100. Run uvicorn main:app --host 127.0.0.1 --port 8013 from backend/.

Build with NEXT_PUBLIC_API_URL=http://localhost:8013/api, run next start --port 3100, then node tests/v3-ux.browser.cjs. Set V3_CHROMIUM_PATH if using an existing Chrome installation instead of Playwright's downloaded Chromium. The test uses a different rate-limit identity per run. The real daily-budget rejection happens before a provider call; the following request reaches the real rate-limit middleware.

## Evidence

- [Meeting cards at 375px](v3-verification/meetings-375.png)
- [Transcript controls and participation at 375px](v3-verification/transcript-top-375.png)
- [Homepage hero at 375px](v3-verification/hero-375.png)
- [Real quota messages](v3-verification/real-limit-messages-375.png)
- [Session log](v3-ux-fixes.md)
