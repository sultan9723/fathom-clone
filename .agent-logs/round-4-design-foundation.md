# NoteAI Round 4 — Shared design foundation (DESIGN.md)

## Session
- Date: 2026-09-28
- Branch: `v2` (`main` untouched; local only)
- Source of truth: `DESIGN.md` at the repo root
- Scope: shared foundation only. No page redesigns.

## 1. Tokens — `177400c`, completed by `d70f83b`

Colour hexes now live **only** in `app/globals.css` as CSS variables;
`tailwind.config.ts` maps utility names onto them. `lib/design-tokens.ts`
keeps the non-colour scales Tailwind needs as plain values. Holding hexes in
both a TS file and CSS was the old arrangement and guaranteed drift.

Implemented from DESIGN.md: the full colour table, the three speaker pairs,
radius 8/10/16/24 (999 reserved for status dots), the 4-112 spacing scale,
the type scale, and layout dimensions.

**Removed, as asked:** the light palette and the cyan accent. Cyan was
deleted outright — its 48 call sites across 8 files were migrated to accent,
including raw `#00d4ff` / `#00a3cc` / `rgba(0,212,255,…)` in arbitrary
utilities. The light theme also survived as literal classes, so bare
`bg-white` panel fills became `bg-surface`, the card gradient became a flat
fill (DESIGN.md: no gradients on panels), and `text-white` on `bg-brand`
became `text-accent-ink`. `bg-white/NN` overlays on the black video surface
were left alone — they are not light-theme remnants.

**Two deprecated shims are deliberate.** Tailwind emits nothing for an
unknown class, so deleting these names would have silently unstyled 16 files
behind a green build:
- legacy colour names (`bg-page`, `text-fg-1`, `border-line`, `brand`,
  `surface-1`, `surface-4`) resolve to the nearest DESIGN.md token;
- legacy font sizes, because `text-md` (42 uses) and `text-2xs` are custom
  keys with no Tailwind default and would have lost their size entirely.

Both are marked for deletion with the page redesigns.

## 2. Fonts — `b095f62`
`lib/fonts.ts` loads Geist, Geist Mono and the four Noto faces via
`next/font`, exporting `fontVariables` for the `<html>` className. Inter —
which DESIGN.md explicitly forbids — was what the root layout loaded; it is
gone. The Noto subsets are large, so all four are `preload: false`. They are
never applied globally: they reach an element only through `lib/i18n-text`.
Verified all six `--font-*` variables reach the emitted CSS.

## 3. Primitives — `8b4ea86`
`components/ui/`: Button (primary | secondary | joined, with StatusDot),
Input, SegmentedControl, Badge (default | live), Panel — each matching
DESIGN.md's Components section. The joined variant renders its pulsing dot
itself, so the active state can't be built without it. Focus rings are not
per-component: `globals.css` applies the 2px accent outline at 2px offset to
`:focus-visible` globally.

`Input` omits the native numeric `size` attribute so the height variant can
own that prop name.

## 4. `lib/i18n-text.ts` — `491e405`
`i18nText(code)` returns `{ dir, lang, className, label }` for en, ur, zh,
es, ar, fr, de, ja. Urdu and Arabic are RTL; Urdu gets Nastaliq at 2.1
leading and one step smaller; zh/ja get 1.6. Arabic is deliberately Naskh,
not Nastaliq — Nastaliq is the Urdu calligraphic style. `lang` is a real
BCP 47 tag (`zh-Hans`). Null/unknown codes fall back to English rather than
throwing, because transcript language fields come from the backend and can
be null. 9 tests.

## 5. Motion — `b2c9c15`
Added the `motion` package. `lib/motion.ts` exports DESIGN.md's timings in
both ms and seconds (the package works in seconds, CSS does not), the
ease-out curve in array and CSS form, stagger, and the 110ms/650ms translate
timings. `riseIn` is fade + 12px, inside the 8-18px range, touching only
opacity and transform; `fadeOut` is shorter because exits are faster.
`useReducedMotion` resolves in an effect — reading matchMedia during render
would mismatch on hydration. 7 tests.

## 6. Layout — `d70f83b` (moves) and `7c402e2` (chrome)
Root layout is now the document shell only. `app/(app)/` holds /meetings and
/search behind the 240px sidebar (wordmark, "Join a meeting", nav with only
Meetings, `aria-current="page"`); `app/(marketing)/` holds / with a 1440px
max width and 80px padding. URLs are unchanged — route groups don't appear
in the path. The old global tab bar and header search were deleted.

## Verification
- `pytest` — 13 passed.
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 97 passed, 8 files (16 new).
- `npm run build` — compiled successfully, zero errors, all 6 routes.
- Browser: /meetings renders the 3 real meetings from local Postgres on the
  dark ground with the sidebar and green accent; the detail page opens with
  its transcript and live badge.

## Open items for the page work
- **/search has no link in the UI.** Removing the global header cost it its
  only entry point. Adding a sidebar item would contradict DESIGN.md's
  app shell, so it belongs with the page redesign.
- **Meeting cards still carry `border-l-[3px] border-l-accent`**, which
  DESIGN.md forbids ("No left-border accent stripes").
- **The detail page columns are cramped** — its own `max-w-[1400px]` now sits
  inside the sidebar plus 48px app padding.
- **Both legacy shims** in `tailwind.config.ts` should go with the redesigns.

## Note on a concurrent agent
Another agent (Codex) was working in this tree during the session and built a
landing page on top of these primitives: `app/(marketing)/page.tsx`,
`app/(marketing)/landing.css` and `components/marketing/`. Those were left
uncommitted and unstaged — they are not this session's work. `DESIGN.md`
itself is also still untracked.

One consequence: `git mv`/`git rm` had pre-staged the route moves and the
tab-bar deletion, so they went into `d70f83b` with the colour sweep instead
of the layout commit. Splitting them afterwards would have meant restaging
paths that agent was actively editing, so the commit message records what it
actually contains instead.
