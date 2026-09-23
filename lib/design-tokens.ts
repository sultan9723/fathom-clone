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
}

export const typography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  sizes: {
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
  searchPill: { width: '179px', height: '30px' },
  avatar: '32px',
  buttonSm: { height: '28px', paddingX: '12px' },
}
