/**
 * Design tokens — NoteAI light theme (DESIGN-NOTEAI.md).
 *
 * This file is the source of truth for colour, type and component sizing.
 * `tailwind.config.ts` imports it and derives the utility classes, so a value
 * is changed here and nowhere else. Flipping the palette here is what turns
 * the whole app light: every component styles itself with the derived
 * utilities (bg-page, text-fg-1, border-line, …), so none of them change.
 *
 * The scales keep their original *meaning*, only inverted: surface1→5 still
 * runs least- to most-contrasted against the page, and text1→4 still runs
 * most- to least-prominent. That's why surface1 is the lightest here and was
 * the darkest under the old dark palette.
 */

export const colors = {
  // Backgrounds
  pageBg: '#ffffff',
  topBar: '#ffffff',
  surface1: '#fafafa',
  surface2: '#f5f5f5',
  surface3: '#f0f0f0',
  surface4: '#ebebeb',
  surface5: '#e5e5e5',
  border: '#e0e0e0',
  borderFaint: '#ededed',
  // Header search field — visually distinct from the surface scale.
  searchPill: '#f5f5f5',

  // Text
  text1: '#1a1a1a',
  text2: '#666666',
  text3: '#888888',
  text4: '#bbbbbb',
  // Recurs across card meta rows, inactive sub-nav tabs, and the detail-page
  // date line — distinct from text3, not one of the four numbered text tones.
  // #767676 is 4.54:1 on white — the WCAG AA floor. DESIGN-NOTEAI.md lists
  // #999 for muted text, but that is 2.85:1 and fails at the 11-13px sizes
  // this tone is used for (timestamps, card meta rows, inactive sub-nav).
  textMeta: '#767676',

  // Brand
  brand: '#0070f3',
  // Neon pop accent for the premium visual pass — tab underlines, hover
  // highlights, micro-interaction accents. Distinct from `brand`, which
  // stays the primary-button color.
  cyan: '#00d4ff',

  // Status
  error: '#ef4444',
  danger: '#f77f25',
  warning: '#d97706',
  success: '#10b981',
  info: '#0070f3',

  // Accents
  accent1: '#ff5d69',
  accent2: '#07f5af',
  accent3: '#04d372',
  accent4: '#8451f5',

  // video-panel (#000000) needs no token of its own — it's Tailwind's
  // built-in `black`, used directly in components.
}

export const typography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  sizes: {
    '2xs': '10px',
    xs: '11px',
    sm: '12px',
    base: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '22px',
    '3xl': '28px',
  },
  lineHeights: {
    '2xs': '12px',
    xs: '13px',
    sm: '14px',
    base: '16px',
    md: '16px',
    lg: '20px',
    xl: '22px',
    '2xl': '28px',
    '3xl': '32px',
  },
}

export const components = {
  topBarHeight: '50px',
  // The tab bar sits directly below the header and is also 50px, but is a
  // separately-specified element (own border-top) — kept as its own token
  // rather than reusing topBarHeight so the two can diverge later.
  tabBarHeight: '50px',
  subNavHeight: '47px',
  searchPill: { width: '179px', height: '30px' },
  avatar: '32px',
  buttonSm: { height: '28px', paddingX: '12px' },

  askSidebarWidth: '448px',
  notesColumnWidth: '385px',
  videoMinHeight: '250px',
  transcriptSearchPill: { width: '194px', height: '33px' },
  resumeScrollPill: { width: '171px', height: '28px' },
  shareModalWidth: '480px',
  toggle: { width: '32px', height: '18px', thumb: '14px' },
  askComposerHeight: '91px',
  sendButtonCircle: '28px',
  askSendButton: { width: '35px', height: '30px' },
  shareCopyButtonHeight: '34px',
  actionCheckbox: '16px',
}
