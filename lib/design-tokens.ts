/**
 * Design tokens taken from Fathom's live CSS.
 *
 * This file is the source of truth for colour, type and component sizing.
 * `tailwind.config.ts` imports it and derives the utility classes, so a value
 * is changed here and nowhere else.
 */

export const colors = {
  // Backgrounds
  pageBg: '#1a1a1a',
  topBar: '#212124',
  surface1: '#121314',
  surface2: '#1d1e1f',
  surface3: '#26262a',
  surface4: '#29292e',
  surface5: '#343435',
  border: '#4a4b4b',
  borderFaint: '#616162',
  // Header search field — visually distinct from the surface scale.
  searchPill: '#2d2c31',

  // Text
  text1: '#ffffff',
  text2: '#c2c2c2',
  text3: '#969696',
  text4: '#505050',

  // Brand
  brand: '#00beff',

  // Status
  error: '#eb3341',
  danger: '#f77f25',
  warning: '#ffc82f',
  success: '#00974f',
  info: '#0180ff',

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
