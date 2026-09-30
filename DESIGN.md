# NoteAI Design System

Reference designs: the "NoteAI — Landing & App" canvas. When this file and a screen disagree, this file wins.

## Principles

1. **Every element earns its place.** No decoration, gradients, glows, emoji or filler copy.
2. **Motion explains.** Every animation shows what changed, where something came from, or what happens next. If it only looks nice, remove it.
3. **Languages are first-class.** Urdu, Arabic and Chinese get proper fonts, direction and line height. Never render them as an afterthought.
4. **Green means live or act.** The accent is used only for live states, primary actions and the current selection.
5. **Only show what works.** No empty tabs, fake data or placeholder features in the app.

## Color tokens

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0A0B0D` | Page background |
| `surface` | `#121417` | Cards, panels, inputs |
| `surface-2` | `#181B1F` | Nested surfaces, tiles |
| `surface-hover` | `#16191D` | Hovered rows, selected nav |
| `border` | `#24282E` | Default borders |
| `border-subtle` | `#1C1F24` | Dividers, table lines |
| `border-strong` | `#2E333A` | Secondary button outline |
| `text` | `#EDEFF2` | Primary text |
| `text-2` | `#C9CED6` | Secondary text on surfaces |
| `muted` | `#9BA3AE` | Descriptions, metadata |
| `faint` | `#7C8490` | Labels, timestamps (minimum for text) |
| `accent` | `#4ADE80` | Live, primary actions, current selection |
| `accent-ink` | `#06210F` | Text on accent |
| `accent-bg` | `#10201A` | Live badges, highlighted rows |
| `accent-bg-2` | `#16261C` | Active/joined button, current transcript line |
| `accent-border` | `#2B5A3E` | Border around accent-tinted areas |
| `warn` | `#F5B971` | Errors and warnings (text), speaker 2 |
| `warn-border` | `#3B2F22` | Border on error panels |

Speaker colors (text on dark, avatar background in brackets):
Speaker 1 `#EDEFF2` (`#2A2F36`) · Speaker 2 `#F5B971` (`#3A2F22`) · Speaker 3 `#7DB4FF` (`#1E2A3B`). Assign in order of first appearance.

Contrast: body text uses `text` or `text-2`. Never use anything darker than `faint` for text.

## Typography

- **Sans (everything):** Geist, via `next/font`. Fallback `system-ui, sans-serif`.
- **Mono (timestamps, links, labels):** Geist Mono.
- **Script fonts (only for text in those languages):** Noto Nastaliq Urdu, Noto Naskh Arabic, Noto Sans SC, Noto Sans JP.

**Seven sizes. Every heading in the product is one of these — no one-off
sizes, on any screen.** Ranges are gone on purpose: a range is an invitation
to invent an eighth size.

| Style | Size / line height | Weight | Tracking | Typical colour |
|---|---|---|---|---|
| H1 | 56 / 1.05 | 600 | -0.03em | `text` |
| H2 | 36 / 1.15 | 600 | -0.02em | `text` |
| H3 | 24 / 1.25 | 600 | -0.01em | `text` |
| H4 | 18 / 1.3 | 600 | 0 | `text` |
| Body | 16 / 1.55 | 400 | 0 | `text-2` |
| Small | 13 / 1.4 | 400 | 0 | `muted` |
| Caption | 11 / 1.3 | 500 | 0.1em | `faint` |

Caption is Geist Mono, uppercase. It is the only style that changes family.

Tailwind exposes these as `text-h1` … `text-caption`; each carries its own
line height, weight and tracking, so `text-h2` alone is the whole style.

The hero on the reference canvas is drawn at 64px. That is a mockup
inconsistency, not an eighth size: the hero uses H1 at 56.

### Multilingual rules

- Set `lang` on every translated element and `dir="rtl"` for Urdu and Arabic, with `text-align: right`.
- Urdu (Nastaliq) needs line height ~2.1 and one step smaller font size; Chinese/Japanese ~1.6.
- When showing a translation, keep the original visible (muted, smaller) underneath or beside it.
- Language labels are written in their own script: English, اردو, 中文, Español.

## Spacing, radius, size

- Spacing scale (px): 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 72, 112.
- Radius: 7–8 (chips, small buttons), 10 (buttons, inputs), 14–16 (cards, panels), 20–24 (large sections), 999 only for status dots.
- Minimum touch target: 44px.
- App layout: 240px sidebar, content padding 28–32px vertical / 48px horizontal. Landing: 80px side padding, 1440 max width.

## Components

Each pattern below lives in exactly one component. A screen that needs a
button imports `Button`; it does not style a `<button>` itself. If a screen
seems to need a variant that isn't here, that is a conversation about the
system, not a local override.

### Buttons

**Two variants. No third.** Both are 44px tall with a 10px radius, 20px
horizontal padding, and 14px text.

| | Background | Text | Border | Weight |
|---|---|---|---|---|
| Primary | `#4ADE80` | `#06210F` | none | 600 |
| Secondary | transparent | `#EDEFF2` | 1px `#2E333A` | 500 |

Four states each:

- **Default** — as above. Hover dims slightly (`brightness-95` on primary,
  `surface-hover` fill on secondary).
- **Disabled** — primary drops to `#1D3325` with `#4ADE80` at 50%; secondary
  keeps its border and drops to 50% opacity. Both `cursor: not-allowed`, and
  both stop pointer events so a disabled control cannot be clicked.
- **Loading** — keeps the default fill and shows a 14px spinner at `gap: 8px`
  before the label. The spinner is a 2px ring in the button's own text colour
  at one-third alpha, with a solid `border-top-color`. `cursor: default`, and
  `aria-busy="true"`. Loading implies disabled.
- **Focus** — `2px solid #4ADE80` outline at 2px offset, from the global
  `:focus-visible` rule, never re-declared per component.

The reference canvas draws no disabled or loading state for secondary. Those
are derived from primary's pattern — same structure, secondary's colours.

**Navbar buttons are a deliberate exception: 40px tall, 9px radius, 13px
text.** The navbar is 72px and a 44px control inside it leaves too little
breathing room above and below. This is the only place the button metrics
change, it is drawn that way on the reference canvas, and it is expressed as
`size="nav"` rather than by hand-editing a button's classes.

### Cards

**One base style, used for every card in the product** — meeting, summary,
action item, language, and anything added later:

    padding: 20px; border-radius: 16px;
    background: #121417; border: 1px solid #24282E;

No per-page variants, no left-border accent stripes, no drop shadows. A card
that needs to read as selected changes its border colour, not its shape.

### Navbar

72px tall, `padding: 0 32px`, three groups spaced apart:

- **Left** — logo: 9px accent dot, 10px gap, 18px/600 wordmark.
- **Centre** — links, 32px gap, 14px, `muted`.
- **Right** — Sign in (secondary) then the primary action, 10px gap, both at
  the navbar size above.

Bottom edge `1px solid #1C1F24`.

### Footers

**Two variants, and only two.**

- **Marketing (full)** — 84px, `padding: 0 32px`, space-between: logo, then
  links at 24px gap / 13px, then the credit line in `faint`. Top edge
  `1px solid #1C1F24`.
- **App (minimal)** — 48px, centred, one line of Geist Mono 11px in `#5E6570`
  reading `NoteAI · <version>`. It sits inside the app shell.

A screen has exactly one footer. Marketing pages get the full one; app pages
get the minimal one.

### Inputs and the rest

**Input:** `surface` or `bg` fill, 1px `border`, radius 10, height 44–52.
Links and URLs in Geist Mono.
**Segmented control (language switcher):** container `bg` + `border`, radius
10, 4px padding; selected option `accent` fill with `accent-ink` text.
**Chip / badge:** height 24–30, radius 6–8. Live badge: `accent-bg` +
`accent` text + pulsing dot.
**Status dot:** 6–10px circle, `accent`, pulses when live.

### Ambient background

Two soft radial glows drifting slowly behind the content, on marketing and
app pages alike. They are decoration and carry no meaning, so they are
`aria-hidden` and sit behind everything at `z-index: 0`.

| | Size | Position | Colour |
|---|---|---|---|
| Green | 700×700 | `top: -200px; left: -150px` | `rgba(74,222,128,0.16)` → transparent at 70% |
| Blue | 800×800 | `bottom: -250px; right: -150px` | `rgba(125,180,255,0.10)` → transparent at 70% |

Both are `border-radius: 50%` with `filter: blur(10px)`, and drift on
independent loops so they never beat in sync:

    @keyframes drift-a { 0%,100% { translate(-10%,-10%) scale(1)    } 50% { translate(6%,4%)   scale(1.15) } }
    @keyframes drift-b { 0%,100% { translate(8%,6%)    scale(1.05) } 50% { translate(-6%,-8%) scale(0.95) } }

Green runs `drift-a` over 18s, blue `drift-b` over 22s, both
`ease-in-out infinite`. Only `transform` animates.

**Under `prefers-reduced-motion` the glows render fully static** — still
visible, still in position, simply not moving.

### Mobile drawer

Slides in from the right over the page. **This spec, not the reference
artboard, is the source of truth**: the implementation in
`components/layout/navigation-drawer.tsx` is deliberately stricter than the
mockup in one respect, noted below.

- **Panel** — 300px wide, full height, `background: #121417`, `border-left:
  1px solid #24282E`, `box-shadow: -20px 0 40px rgba(0,0,0,0.4)`, padding
  `24px 20px`.
- **Motion** — `translateX(100%)` → `translateX(0)` over **260ms**
  `cubic-bezier(.2,.8,.2,1)`. The close timer must match the duration, or the
  panel disappears mid-animation.
- **Backdrop** — dark, fading in over the same 260ms. **It covers the whole
  viewport**, including the header. The reference artboard draws it starting
  below the header, which would leave the header clickable behind a modal;
  full-inset is the correct behaviour and is what ships.
- **Links** — 48px tall, radius 10, `gap: 4px` between them. The current one
  is tinted `surface-hover` and marked `aria-current`.
- **Footer** — the app footer line, `NoteAI · <version>`, pinned to the
  bottom of the panel.
- **Close** — a real icon button with `aria-label`, focused when the drawer
  opens.
- **Behaviour** — focus is trapped inside while open and returns to whatever
  opened it on close; Escape closes; clicking outside closes; background
  scroll is locked and restored; it closes itself if the viewport grows to
  desktop width.

Under `prefers-reduced-motion` the drawer appears without sliding.

## Motion

Tokens:

| Token | Value |
|---|---|
| `fast` | 150ms (hover, focus, color) |
| `base` | 250–300ms (toggles, selection) |
| `slow` | 450–600ms (panels, entrances) |
| `ease-out` | `cubic-bezier(.2,.8,.2,1)` — default for everything entering |
| `stagger` | 100–150ms between related items |

Rules:

- Animate only `opacity`, `transform` and `clip-path`. Never layout properties.
- Entrances: fade + 8–18px rise. Exits are faster than entrances.
- No bounce, no spin, no infinite motion except live indicators (pulse) and skeletons.
- Signature moments (use only these, don't invent new ones):
  1. **Join:** link types in → platform detected → "Joining…" → "Joined · Listening".
  2. **Transcribe:** lines appear word by word with a caret.
  3. **Translate:** text scrambles in the target script and resolves line by line (110ms stagger, ~650ms per line).
  4. **Understand:** summary items appear as their source transcript lines highlight.
- Landing "How it works" is scroll-driven: a pinned stage, five steps, progress bar per step, steps also clickable.
- Always honor `prefers-reduced-motion`: show the final state instantly, no scramble, no streaming.

## Accessibility

- Real `<button>`, `<a>`, `<input>` + `<label>`. Icon-only buttons get `aria-label`.
- Visible focus: 2px `accent` outline, 2–3px offset.
- Toggle groups use `aria-pressed`; current nav item uses `aria-current="page"`.
- Progress uses `role="progressbar"` with values.

## Copy tone

Plain, direct language. Say what the product does, in the words someone would
use out loud.

**Banned outright** — these words describe nothing and signal machine-written
copy: seamless, seamlessly, empower, empowering, unlock, revolutionize,
revolutionary, cutting-edge, game-changing, leverage (as a verb), elevate,
supercharge, effortless, transform your, take it to the next level, harness,
unleash, delve, robust, best-in-class, world-class, state-of-the-art.

Also avoid: stacked superlatives, "powered by AI" as a selling point (say what
it does instead), and exclamation marks in product copy.

Write "NoteAI writes down what everyone says" rather than "seamlessly unlock
the power of your conversations". Prefer the concrete noun: "transcript",
"summary", "action item".

## Don't

- Don't use Inter, Roboto or Arial.
- Don't add gradients (skeleton shimmer is the only exception), glows, or shadows.
- Don't use official Zoom / Google Meet / Teams logos; use their names as text.
- Don't ship empty nav items, "coming soon" pages or hardcoded demo data inside the app. Demo content belongs only on the landing page.
- Don't invent stats, testimonials or pricing.
