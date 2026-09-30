import type { Config } from 'tailwindcss'
import { layout, radius, spacing, typeScale } from './lib/design-tokens'

/**
 * DESIGN.md tokens as Tailwind utilities.
 *
 * Colours resolve to the CSS variables declared in app/globals.css, so the
 * hexes live in exactly one place. Names match DESIGN.md's token table:
 *   bg, surface, surface-2, surface-hover, border, border-subtle,
 *   border-strong, text, text-2, muted, faint, accent, accent-ink,
 *   accent-bg, accent-bg-2, accent-border, warn, warn-border.
 */
const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          hover: 'var(--surface-hover)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        text: {
          DEFAULT: 'var(--text)',
          2: 'var(--text-2)',
        },
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
          bg: 'var(--accent-bg)',
          'bg-2': 'var(--accent-bg-2)',
          border: 'var(--accent-border)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          border: 'var(--warn-border)',
        },
        speaker: {
          1: 'var(--speaker-1)',
          '1-bg': 'var(--speaker-1-bg)',
          2: 'var(--speaker-2)',
          '2-bg': 'var(--speaker-2-bg)',
          3: 'var(--speaker-3)',
          '3-bg': 'var(--speaker-3-bg)',
        },

      },

      borderRadius: {
        chip: radius.chip,
        control: radius.control,
        card: radius.card,
        section: radius.section,
      },

      spacing: {
        ...spacing,
        sidebar: layout.sidebarWidth,
        'app-y': layout.appPaddingY,
        'app-x': layout.appPaddingX,
        'landing-x': layout.landingPaddingX,
        touch: layout.touchTarget,
        control: layout.controlHeight,
        'control-lg': layout.controlHeightLg,
        input: layout.inputHeight,
        'input-lg': layout.inputHeightLg,
        badge: layout.badgeHeight,
      },

      maxWidth: {
        landing: layout.landingMaxWidth,
      },

      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        urdu: ['var(--font-noto-nastaliq-urdu)', 'serif'],
        arabic: ['var(--font-noto-naskh-arabic)', 'serif'],
        sc: ['var(--font-noto-sans-sc)', 'var(--font-geist-sans)', 'sans-serif'],
        jp: ['var(--font-noto-sans-jp)', 'var(--font-geist-sans)', 'sans-serif'],
      },

      fontSize: typeScale as unknown as Record<string, [string, Record<string, string>]>,

      transitionTimingFunction: {
        'ease-out-design': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '280ms',
        slow: '520ms',
      },

      keyframes: {
        // DESIGN.md entrances: fade + 8-18px rise. Never layout properties.
        enter: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        enter: 'enter 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pulse-dot': 'pulse-dot 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/container-queries')],
}
export default config
