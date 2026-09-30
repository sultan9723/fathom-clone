# NoteAI Round 10 — v3 polish

## Session
- Date: 2026-09-30
- Branch: `v3-polish`, from the tip of `v3-design-system` (`3238a41`) — on top
  of the design-system work, not alongside it.
- `main` untouched. No PR opened or merged.

## 1. Hero background motion — `9983e13`
**Concept: a signal field.** Two drifting blobs is competent wallpaper and
also the most common landing background on the web, so it reads as a default
rather than a decision.

Three changes, all transform/opacity only:
- **A third glow**, low and centre, filling the dead zone under the headline.
  Periods changed to **19s / 23s / 29s** from 18 / 22. Coprime periods mean
  the composite does not repeat for hours — what makes a two-blob background
  feel cheap is catching it reset.
- **Signal rails**: a faint field of horizontal lines drifting upward by
  exactly one line pitch per cycle, so the loop is seamless. Reads as
  transcript lines moving behind the words — the product's own subject as
  texture. Radially masked out of the centre so it never competes with the
  headline. First pass at 1.6% effective alpha was invisible on a dark
  screen; tuned to ~6%.
- **Parallax** at 0.12x scroll. Passive, rAF-throttled, writes one custom
  property feeding only a transform. `scrollY` is read once per frame outside
  any style write, so it cannot force a reflow.

App pages keep the calm two-glow default; the hero is the one screen where
the background does persuasive work.

Reduced motion handled twice: all four animations sit behind `motion-safe:`
(verified in the emitted CSS — each resolves to
`@media (prefers-reduced-motion: no-preference)`), and the scroll listener is
never attached rather than attached-and-throttled.

**Awaiting approval** — the user asked to see the direction before this is
considered final.

## 2. Sign-in — `5d4362e`
The card sat at the top of a tall empty canvas with a **second "NoteAI"
wordmark** stacked under the navbar's. Two wordmarks in a column is what a
half-rendered page looks like.

Now centred both ways in the viewport minus chrome, via new `--navbar-h` /
`--footer-h` variables so the heights are not written twice. The page's own
wordmark is gone. The CTA and "Back to NoteAI" were overlapping and are now a
flex row with a real gap, stacking on narrow screens, with a 44px target on
the link.

Measured: 1440x900 → 248px above / 247px below, 455px either side of a 520px
card in a 1430px document. 375x812 → 144 / 143.

The ambient background needed no work; it comes from the layout. What the
page lacked was a layout that let it show. Dead `.product-sign-in` rules
removed.

## 3. Participant tiles — `e212d93`
The tiles stopped short of the bar above them. The cause was the column
count: `.participants` had its columns set per breakpoint and **the two rules
had inverted** — 4 columns under `(max-width: 1023px), (max-height: 759px)`,
2 everywhere else. A wide desktop got a 2x2 block of oversized tiles.

First fix attempt, `repeat(auto-fit, minmax(128px, 1fr))`, measured correct
on the grid element but was still wrong: at 1440 it fits **five columns for
four tiles**, so the last tile ends one column short while the grid still
reports full width. Measuring the container rather than the tiles would have
missed it.

There are exactly four tiles, so the column count must divide them: 2 up
below 640, 4 from 640 up. Verified at 1440, 1280x700, 900, 640, 375 by
comparing the first tile's left and last tile's right against the bar above
and notice below — identical at every size.

Also checked the other candidate on the page, the Zoom / Google Meet / Teams
pills in the join preview: already flush (296–1134 at 1440, 45–321 at 375).
Unchanged.

## 4. Joining preview — `b7dd719`
Was a `<details>` collapsed by default, hiding the one place on the page that
shows what joining will look like — the section's whole point — behind a
click. The likely reason was page length: the section already carries four
integration cards and the preview adds a form plus an animated demo. Noted,
but a demo nobody opens is worth less than a slightly longer page.

Now a plain `<div>` with an H4 title, open on load, no toggle. The "cannot
join a call or upload a recording" caption moved out of the summary into body
text, so it is visible at the same time as the controls it describes.

## Verification
- `npx next build` — compiled, 11/11 static pages, 10 routes.
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 65 passed, 9 files.
- Each fixed page viewed in the browser; measurements taken from the rendered
  DOM rather than by eye, after the auto-fit near-miss showed that measuring
  the wrong element looks like success.
