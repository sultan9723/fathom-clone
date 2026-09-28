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
 *
 * The LEGACY block at the bottom is a deprecated compatibility shim. The
 * pages written against the old light palette (bg-page, text-fg-1, …) are
 * scheduled for redesign; until then those names resolve to the closest
 * DESIGN.md token so the app renders coherently instead of silently losing
 * its styles — Tailwind emits nothing for an unknown class, so dropping the
 * names outright would break 16 files with a passing build. Delete this
 * block once the pages are redesigned; nothing new should use it.
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

        // ---- LEGACY: remove with the page redesigns ----
        // The old numbered surface scale ran least- to most-contrasted
        // against a white page; mapped onto the dark tokens it keeps that
        // meaning. Only the two still in use are kept — surface-2 already
        // comes from the `surface` object above.
        'surface-1': 'var(--surface)',
        'surface-4': 'var(--surface-hover)',
        page: 'var(--bg)',
        topbar: 'var(--surface)',
        line: {
          DEFAULT: 'var(--border)',
          faint: 'var(--border-subtle)',
        },
        fg: {
          1: 'var(--text)',
          2: 'var(--text-2)',
          3: 'var(--muted)',
          4: 'var(--faint)',
          meta: 'var(--faint)',
        },
        brand: 'var(--accent)',
        'brand-hover': 'var(--accent)',
        error: 'var(--warn)',
        danger: 'var(--warn)',
        warning: 'var(--warn)',
        success: 'var(--accent)',
        info: 'var(--accent)',
        'search-pill': 'var(--surface-2)',
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

      fontSize: {
        ...(typeScale as unknown as Record<string, [string, Record<string, string>]>),
        // ---- LEGACY sizes: remove with the page redesigns ----
        // text-md and text-2xs are custom keys with no Tailwind default, so
        // dropping them would silently remove the font-size from 40+ call
        // sites rather than change it. Kept at their old px values.
        '2xs': ['10px', '12px'],
        xs: ['11px', '13px'],
        sm: ['12px', '14px'],
        base: ['13px', '16px'],
        md: ['14px', '16px'],
        lg: ['16px', '20px'],
        xl: ['18px', '22px'],
        '2xl': ['22px', '28px'],
        '3xl': ['28px', '32px'],
      },

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
