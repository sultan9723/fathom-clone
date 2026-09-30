# NoteAI Round 9 — Design system from the reference canvas

## Session
- Date: 2026-09-30
- Branch: `v3-design-system`, from `origin/main` `da5e9fe`
- `main` untouched; no PR opened or merged.
- Reference: the "NoteAI — Landing & App" canvas
  `8f2c1875-9779-4e06-9642-feaf8f9ada22`, artboards `SystemRef`,
  `HeroMotion`, `MobileDrawer`, read as raw `.dc.html` source.

## Before starting
The URL supplied in the brief (`/artifact/JgQuRgRrvPHLDjJPpUWksj`) is not a
valid artifact address and matched nothing. The canvas was found by the name
`DESIGN.md:3` already cites, and confirmed by the user.

`origin/main` had also moved 11 commits past the pinned `fd232db` via PR #9
(v3-ux-fixes), four of which touch this work — including an existing
`navigation-drawer.tsx`. Confirmed with the user before branching, and the
drawer was adapted rather than replaced.

## Step 1 — DESIGN.md — `3d0879f`
Every spec is now a single number taken from the canvas, not a range.
Ranges were how the product acquired per-page card styles and one-off
headings.

Type scale: seven sizes (H1 56 → Caption 11), each carrying its own line
height, weight and tracking. Buttons: two variants, four states. Cards: one
base style. Navbar, both footers, the glows and the drawer get exact values.
Adds a copy-tone section with a banned-word list.

Three departures, all written down:
- Navbar buttons stay 40/9/13; a 44px control in a 72px bar is too tight,
  and the canvas draws them smaller. Expressed as `size="nav"`.
- The drawer backdrop covers the whole viewport. The artboard draws it
  starting below the header, which would leave the header clickable behind a
  modal. DESIGN.md is the source of truth for the drawer, not the artboard.
- The canvas draws the hero at 64px. That is a mockup inconsistency; the
  hero uses H1 at 56.

## Step 2 — primitives — `7626c82`
`Button` (two variants, disabled with its own fill, loading with spinner +
`aria-busy`, `disabled:pointer-events-none`), `ButtonLink` sharing
`buttonClasses()` so navigation stays a real anchor, `AmbientBackground`,
`Navbar`, `Wordmark`, `MarketingFooter`, `AppFooter`. The `joined` variant
was removed — its one use was a status, which is the live `Badge`.

Drawer adapted: kept native `<dialog>` inertness, Escape, click-outside,
focus return, scroll lock, auto-close at desktop. Closed the approved
deltas. The close timer now reads one constant matching `--drawer-duration`,
so the panel cannot vanish mid-animation.

## Step 3 — every screen — `71d7bd8`
Layouts gained the navbar, footers and ambient background; the landing
page's duplicate header and footer were removed, and
`components/marketing/header.tsx` with them.

Two competing button systems — `.landing-action` and `.product-link-button`
— were collapsed onto `Button`/`ButtonLink` and their CSS deleted rather
than left to be picked up again.

Heading sizes came mostly from `product.css` and `landing.css`, so those
rules were snapped to the scale rather than adding classes to dozens of
elements.

The AI-fluff scan across every `.tsx`, `.ts` and `.css` returned nothing.

## Step 4 — audit — `45ac3f7`
Nine routes × two widths, measured from the rendered DOM rather than by eye.

Found and fixed:
1. **Ambient glows invisible everywhere.** `<body>` carried an opaque
   background; a block's background paints after its negative-z descendants.
2. **Drawer CTA muted green on green.** `.drawer-links a` (0,1,1) outbid
   `text-accent-ink` (0,1,0).
3. **Five sub-44px tap targets** — platform chips 37, filters 38, footer
   links 18, navbar links 22, wordmark 23.
4. **Mobile menu toggles at 40px** — the nav exception is for the desktop
   bar; on a phone the toggle is a touch target.
5. **Four off-scale sizes inside media queries** plus the landing h2 clamp
   floor at 28.

Checked and left alone: scroll-story step buttons at 102px are composite
controls; one "missing footer" reading was a mid-load measurement.

## Verification
- `npx next build` — compiled, 11/11 static pages, 10 routes.
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 65 passed, 9 files.
- Browser: all nine routes at 1440 and 375 report no off-scale headings,
  exactly one footer, ambient present, no tap target under 44, no horizontal
  overflow. Drawer specs and the reduced-motion gating were measured, not
  assumed.

## Open
- `lg`(48px) and `nav`(40px) button sizes exist alongside the 44px default.
  Both are in DESIGN.md; if the hero is meant to use the plain 44 as well,
  `lg` could go.
- App page titles became H2 (36) from a drawn 28. 28 is not on the scale and
  36 gives real separation from H4 card titles; H3 (24) was the alternative.
