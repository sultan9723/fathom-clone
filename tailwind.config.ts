import type { Config } from 'tailwindcss'
import { colors, typography, components } from './lib/design-tokens'

/**
 * Every value here comes from `lib/design-tokens.ts`. Nothing is hardcoded.
 *
 * Token -> utility naming:
 *   pageBg / topBar        -> bg-page      bg-topbar
 *   surface1..5            -> bg-surface-1 .. bg-surface-5
 *   border / borderFaint   -> border-line  border-line-faint
 *   text1..4               -> text-fg-1 .. text-fg-4
 *   brand, status, accents -> text-brand, bg-error, text-accent-1, ...
 */
const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        page: colors.pageBg,
        topbar: colors.topBar,
        surface: {
          1: colors.surface1,
          2: colors.surface2,
          3: colors.surface3,
          4: colors.surface4,
          5: colors.surface5,
        },
        line: {
          DEFAULT: colors.border,
          faint: colors.borderFaint,
        },
        fg: {
          1: colors.text1,
          2: colors.text2,
          3: colors.text3,
          4: colors.text4,
        },
        brand: colors.brand,
        error: colors.error,
        danger: colors.danger,
        warning: colors.warning,
        success: colors.success,
        info: colors.info,
        accent: {
          1: colors.accent1,
          2: colors.accent2,
          3: colors.accent3,
          4: colors.accent4,
        },
      },

      fontFamily: {
        // next/font supplies the Inter face; the token provides the fallbacks.
        sans: [`var(--font-inter)`, ...typography.fontFamily.split(',').map((f) => f.trim())],
      },

      // Each size carries its paired line height from the tokens.
      fontSize: Object.fromEntries(
        Object.entries(typography.sizes).map(([key, size]) => [
          key,
          [size, typography.lineHeights[key as keyof typeof typography.lineHeights]],
        ])
      ) as Record<string, [string, string]>,

      spacing: {
        topbar: components.topBarHeight,
        avatar: components.avatar,
        'pill-w': components.searchPill.width,
        'pill-h': components.searchPill.height,
        'btn-sm': components.buttonSm.height,
        'btn-sm-x': components.buttonSm.paddingX,
      },
    },
  },
  plugins: [],
}
export default config
