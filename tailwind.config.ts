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
 *   searchPill             -> bg-search-pill
 *
 * Radius is NOT customized: SPEC's 4/6/8/9999px scale maps exactly onto
 * Tailwind's built-in rounded/rounded-md/rounded-lg/rounded-full.
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
          meta: colors.textMeta,
        },
        brand: colors.brand,
        'brand-hover': '#20c5ff',
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
        'search-pill': colors.searchPill,
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

      // Element-specific one-off dimensions live here, not in `spacing`
      // (which also drives padding/margin/gap and shouldn't carry these).
      minHeight: {
        video: components.videoMinHeight,
      },
      width: {
        'ask-sidebar': components.askSidebarWidth,
        'notes-col': components.notesColumnWidth,
        'transcript-search': components.transcriptSearchPill.width,
        'resume-pill': components.resumeScrollPill.width,
        'share-modal': components.shareModalWidth,
        toggle: components.toggle.width,
        'send-circle': components.sendButtonCircle,
        'ask-send': components.askSendButton.width,
      },
      height: {
        'sub-nav': components.subNavHeight,
        'tab-bar': components.tabBarHeight,
        'transcript-search': components.transcriptSearchPill.height,
        'resume-pill': components.resumeScrollPill.height,
        toggle: components.toggle.height,
        'ask-composer': components.askComposerHeight,
        'send-circle': components.sendButtonCircle,
        'ask-send': components.askSendButton.height,
        'share-copy': components.shareCopyButtonHeight,
        'action-checkbox': components.actionCheckbox,
      },
    },
  },
  plugins: [require('@tailwindcss/container-queries')],
}
export default config
