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
export const typeScale = {
  display: ['76px', { lineHeight: '1.02', letterSpacing: '-0.035em', fontWeight: '600' }],
  h2: ['46px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
  h1: ['28px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
  title: ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
  'body-lg': ['19px', { lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' }],
  body: ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
  'body-sm': ['15px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
  small: ['14px', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '400' }],
  'small-xs': ['13px', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '500' }],
  label: ['12px', { lineHeight: '1.2', letterSpacing: '0.1em', fontWeight: '500' }],
  'label-sm': ['11px', { lineHeight: '1.2', letterSpacing: '0.1em', fontWeight: '500' }],
} as const

/** Layout dimensions from DESIGN.md. */
export const layout = {
  sidebarWidth: '240px',
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
