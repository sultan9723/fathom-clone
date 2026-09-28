# NoteAI product conformance audit and implementation plan

Reference: `NoteAI — Landing & App.pdf`, all eight pages rendered and inspected.
Baseline: active `v2` at `b0e838d`, 28 September 2026.
This audit was completed before product implementation began. The PDF and the
current user request take precedence over older visual specs. Backend source,
schemas, migrations, services, authentication and database architecture are out
of scope for modification. Existing dirty backend files belong to prior work;
SHA-256 baselines have been recorded for all backend source/configuration files.

## Repository and capability inventory

| Area | Existing implementation | Finding |
| --- | --- | --- |
| Public routes | `/` in marketing group redirects to `/meetings` | Landing exists separately on `v2-landing`, not active `v2`; reference copy was previously unavailable. |
| App routes | `/meetings`, `/meetings/[id]`, `/search` | All use real FastAPI meeting data. No Join, Action items or Settings routes. |
| Shell | root font/document layout; marketing container; app sidebar | 240px sidebar only has Meetings; Join button inert; mobile navigation disappears; no profile area. |
| UI system | Button, Input, Badge, Panel, SegmentedControl; CSS tokens; Geist/Noto fonts; motion helpers | Sound shared foundation. Route-level styling still uses old shadows, gradients, undersized text, accent stripes and invalid legacy utilities. |
| Client API | `lib/api.ts`, configured `NEXT_PUBLIC_API_URL` | Real meeting reads, transcript reads, search, action completion, ask and text translation. Missing cancellation/timeout and CRUD/batch-translation client exposure. |
| Database | SQLAlchemy Meeting, Transcript, ActionItem, Note, TranscriptTranslation | Meeting has no platform, live status, recording URL, participants/read-language roster, job state or authenticated owner. ActionItem has owner/due/completed but no source timestamp. Note has no exposed API route. |
| FastAPI | health; meeting list/create/read/update/delete; transcript list/create; action list/create/update; search; ask; text translate; batch transcript translate | Existing translation route and cache were added before this task. Live OpenAPI confirms this route. Do not modify backend. |
| AI | Groq/Anthropic/OpenAI in existing backend | Q&A and summary prompts use real transcripts; text translation can return provider failures inside HTTP 200. Batch translation has HTTP errors and persistent cache. |
| Legacy Next API | `/api/ask`, JSON repository, legacy AI providers | Separate seed-file implementation with mock fallback; not used by the database-backed application. Preserve, do not wire product UI to it. |
| Upload / recording | UI placeholders and known-provider embed helper | No upload, storage, transcription, ingestion-job, recording-read or provider integration API. Current player simulates playback with no recording. |
| Live meeting | recent-created-at heuristic plus timed word reveal | Misleading: a recent DB record is not proof of a live meeting. No meeting bot, waiting-room events, live transport or stop endpoint exists. |
| Translation | separate text translator below transcript | Omits Urdu, adds Portuguese instead; loses line timestamps; no script attributes; summary/actions do not follow the selected language. |
| Completed meeting | metadata, tabbed transcript/summary/actions, Ask, simulated player | Source timestamps work as a local clock, but no Q&A citation buttons, deep links, export, action creation or verified source ownership. |
| States | list/detail skeletons, panel errors, empty states | Some retry support. No true cancel, join/upload failure state, shared translation fallback, accessible async announcements across flows. |
| Tests | 99 Vitest tests; PostgreSQL-isolated backend tests; old Playwright harness | Old browser harness uses mocked API responses and asserts obsolete fake-playback UI; it cannot establish real product behavior. |
| Runtime | Next on 3000; FastAPI on 8000 | Health and OpenAPI readable. Dev/build cache collision already fixed. No connected browser surfaces available at audit time. |

## Baseline checklist against the reference

Classification uses: Implemented correctly; Implemented but inconsistent; Missing;
UI only / backend missing; Backend exists / UI missing; Needs verification.

| PDF page/state | Baseline classification | Required work / constraint |
| --- | --- | --- |
| 1: branding, dark hero, green accent, navigation | Missing on active branch | Integrate existing landing work; reconcile exact Atlas reference text. |
| 1: meeting-link entry and platform selectors | Missing | Real editable link and detected platform; route into honest join flow. |
| 1: Joined / Listening | UI only / backend missing | Allowed only in explicitly labeled marketing demo; never imply a real bot joined. |
| 2: Connect → Listen → Translate → Understand → Ask | Missing on active branch | Reuse marketing story, correct speakers and 12:15 citation from PDF. |
| 3: eight languages and script handling | Implemented correctly in foundation, UI missing | Reuse i18n/font helpers everywhere. |
| 3: Zoom / Meet / Teams / Upload | UI only / backend missing | Surface integration availability truthfully. |
| 4: mobile landing and Urdu preview | Missing | Responsive join controls, script text, original visible, mobile navigation. |
| 5: app sidebar and identity | Implemented but inconsistent | Persistent usable desktop/mobile nav; shared-workspace identity, not invented login. |
| 5: DB-backed meetings and transcript search | Implemented correctly functionally | Keep real API; improve presentation, failure recovery and cancellation. |
| 5: All / Live now / This week, metadata table | Missing / Backend missing | Real week filter; Live unavailable without status source; platform shown as not supplied. |
| 5: action-item management across meetings | Backend exists / UI missing | Aggregate real existing per-meeting action APIs and retain provenance. |
| 6: true live recording, timer, stop, roster | UI only / backend missing | Remove fabricated live status; show unavailable live capability. No synthetic elapsed time or participants. |
| 6: timestamped speaker transcript | Implemented but inconsistent | Preserve real lines, script-aware translation and source navigation. |
| 7: completed meeting metadata and layout | Implemented but inconsistent | Transcript beside summary/actions/Ask; responsive stacking. |
| 7: recording playback | UI only / backend missing | Honest no-recording state; useful transcript timeline without fake play button. |
| 7: summary and decisions | Implemented but inconsistent | Real AI request with language, progress, cancel, retry and original retained. |
| 7: action ownership/completion | Implemented correctly for existing fields | Preserve DB changes; expose creation and aggregate view; avoid stale concurrent row updates. |
| 7: action source timestamps | Missing / Backend missing | Only link citations actually present in a stored title; never fabricate provenance. Report schema gap. |
| 7: multilingual transcript/summary/actions | Backend exists / UI missing | Use batch cached transcript API and text translation; shared selection with original fallback. |
| 7: Ask with exact-moment evidence | Implemented but inconsistent | Real ask endpoint; only link returned timestamps that match actual transcript lines. |
| 7: export/share | Missing | Client-side export of loaded real content; copy recap/deep link with clipboard fallback, no access-control claims. |
| 8: no meetings | Implemented but inconsistent | Useful import-transcript path backed by CRUD; join/upload remain honest about limitations. |
| 8: waiting room / cancel | UI only / backend missing | Reusable state presentation; unreachable as a real workflow until provider events exist. |
| 8: failed join / retry / upload alternative | Missing | Explicit unavailable integration outcome; keep entered link and retry/edit controls. |
| 8: general loading | Implemented but inconsistent | Consistent skeleton/status, independent panel errors, retries and cancellation. |
| 8: upload received / transcribing / translating / summarizing | UI only / backend missing | Do not accept uploads or fabricate percentage/job persistence. Explain unavailable recording processing; real transcript import has actual per-request progress. |
| 8: translation fallback and retry | Implemented but inconsistent | Original transcript, summary and actions remain usable; retry and cancel with no stale-language replies. |
| Auth / share permissions | Missing / Backend missing | Preserve shared API; show no sign-in configured. Do not invent accounts or security. |
| Responsive, keyboard, console/network, provider success | Needs verification | Automated logic/API/route checks, real browser if available, explicit unverified items otherwise. |

## Implementation iterations

1. **Navigation and supported entry flows:** shared product styling, responsive
   app shell, Join/Settings/Action items routes, honest integration states,
   recoverable async state primitives and real API client extensions.
2. **Meeting library and completed meeting:** real DB lists and filters,
   transcript import/create/update/delete, independent panel loading, one reading
   language across transcript/summary/actions, truthful recording/timeline,
   grounded Q&A source jumps, real action changes, export/copy.
3. **Public experience and reference reconciliation:** integrate existing landing,
   use Ming/Ayesha/Daniel and the PDF's exact English Atlas lines; label examples;
   provide functional navigation and honest integration availability.
4. **Verification and polish:** lint, type checking, tests, production build;
   start unchanged backend against a dedicated disposable DB; exercise CRUD,
   search, transcript, action and AI/translation error contracts; assess every
   route and state, responsive rules and accessibility. Compare backend hashes.

No approval gate is required between iterations. Missing services stay documented
as capability gaps; backend changes are prohibited by the current task.

## Final conformance and verification

To be filled after implementation and testing; baseline findings above remain as
the audit record rather than being rewritten as if the gaps never existed.
