/**
 * Non-colour design tokens from DESIGN.md.
 *
 * Colours are NOT here any more: they live as CSS variables in
 * app/globals.css, and tailwind.config.ts maps utility names onto those
 * variables. Keeping hexes in both places was the old arrangement and it
 * guaranteed drift. The scales below stay in TypeScript because Tailwind
 * needs them as plain values, not `var()` references.
 */

/** DESIGN.md spacing scale, in px. Tailwind exposes these as `p-*`, `gap-*`, … */
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  18: '72px',
  28: '112px',
} as const

/**
 * DESIGN.md radius scale. 999px is deliberately absent from the named scale —
 * it is for status dots only, and `rounded-full` already covers that.
 */
export const radius = {
  chip: 'var(--radius-chip)',
  control: 'var(--radius-control)',
  card: 'var(--radius-card)',
  section: 'var(--radius-section)',
} as const

/** DESIGN.md type scale: [font-size, { lineHeight, letterSpacing, fontWeight }] */
/**
 * DESIGN.md's type scale: seven sizes, and only seven. Each entry carries its
 * own line height, weight and tracking, so `text-h2` alone is the whole style
 * and a heading never needs a second class to look right.
 *
 * Deliberately no ranges and no in-between steps. The previous scale had
 * eleven entries with overlapping sizes (14 and 15, 11 and 12), which is how
 * the product ended up with headings that almost matched each other.
 */
export const typeScale = {
  h1: ['56px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
  h2: ['36px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
  h3: ['24px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
  h4: ['18px', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
  body: ['16px', { lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' }],
  small: ['13px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '400' }],
  caption: ['11px', { lineHeight: '1.3', letterSpacing: '0.1em', fontWeight: '500' }],
} as const

/** Layout dimensions from DESIGN.md. */
export const layout = {
  sidebarWidth: '240px',
  /** Navbar is 72px; its buttons are the 40px `nav` size, not the 44px system one. */
  navbarHeight: '72px',
  navButtonHeight: '40px',
  /** Marketing footer is 84px; the app's minimal one is 48px. */
  footerHeight: '84px',
  footerHeightApp: '48px',
  drawerWidth: '300px',
  /** Minimum touch target. */
  touchTarget: '44px',
  controlHeight: '44px',
  controlHeightLg: '48px',
  inputHeight: '44px',
  inputHeightLg: '52px',
  badgeHeight: '26px',
  appPaddingY: '28px',
  appPaddingX: '48px',
  landingPaddingX: '80px',
  landingMaxWidth: '1440px',
} as const
