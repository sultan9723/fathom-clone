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

| Style | Size / line height | Weight | Tracking |
|---|---|---|---|
| Display (landing hero) | 76 / 1.02 | 600 | -0.035em |
| H2 (landing sections) | 44–48 / 1.05 | 600 | -0.03em |
| H1 (app page title) | 28 / 1.2 | 600 | -0.02em |
| Title (card, step) | 20 / 1.3 | 600 | -0.01em |
| Body large | 19 / 1.55 | 400 | 0 |
| Body | 15–16 / 1.5 | 400 | 0 |
| Small | 13–14 / 1.45 | 400–500 | 0 |
| Label (mono, uppercase) | 11–12 | 500 | 0.1em |

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

**Primary button:** `accent` background, `accent-ink` text, 600 weight, height 44–48, radius 10. One per view where possible.
**Secondary button:** transparent, 1px `border-strong`, `text`, 500 weight, same height and radius.
**Joined / active state:** `accent-bg-2` background, `accent` text, pulsing dot.
**Input:** `surface` or `bg` fill, 1px `border`, radius 10, height 44–52. Links and URLs in Geist Mono.
**Segmented control (language switcher):** container `bg` + `border`, radius 10, 4px padding; selected option `accent` fill with `accent-ink` text.
**Chip / badge:** height 24–30, radius 6–8. Live badge: `accent-bg` + `accent` text + pulsing dot.
**Card / panel:** `surface`, 1px `border`, radius 16. No left-border accent stripes, no drop shadows.
**Status dot:** 6–10px circle, `accent`, pulses when live.

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

## Don't

- Don't use Inter, Roboto or Arial.
- Don't add gradients (skeleton shimmer is the only exception), glows, or shadows.
- Don't use official Zoom / Google Meet / Teams logos; use their names as text.
- Don't ship empty nav items, "coming soon" pages or hardcoded demo data inside the app. Demo content belongs only on the landing page.
- Don't invent stats, testimonials or pricing.
