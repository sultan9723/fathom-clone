/**
 * Per-language text presentation, from DESIGN.md's multilingual rules.
 *
 * DESIGN.md treats languages as first-class: Urdu, Arabic and CJK get the
 * right face, direction and line height rather than being rendered in the
 * Latin stack and hoping. This module is the single place that decides that,
 * so every translated string is marked up the same way:
 *
 *   const { dir, lang, className } = i18nText('ur')
 *   <p dir={dir} lang={lang} className={className}>{urduText}</p>
 *
 * The `lang` attribute matters beyond styling — screen readers switch voice
 * on it, and it drives the browser's own font fallback.
 */

export type LanguageCode = 'en' | 'ur' | 'zh' | 'es' | 'ar' | 'fr' | 'de' | 'ja'

export type TextDirection = 'ltr' | 'rtl'

export interface I18nText {
  /** For the `dir` attribute. */
  dir: TextDirection
  /** For the `lang` attribute — a BCP 47 tag. */
  lang: string
  /** Tailwind classes: font family, line height, and size adjustment. */
  className: string
  /** The language's name in its own script, per DESIGN.md. */
  label: string
}

/**
 * DESIGN.md:
 * - Urdu (Nastaliq) needs line height ~2.1 and one step smaller font size.
 * - Chinese and Japanese need ~1.6.
 * - Urdu and Arabic are RTL.
 * - Language labels are written in their own script.
 *
 * `font-sans` is Geist, which covers Latin. Arabic gets Naskh rather than
 * Nastaliq: Nastaliq is the Urdu calligraphic style and is wrong for Arabic.
 */
const LANGUAGES: Record<LanguageCode, I18nText> = {
  en: { dir: 'ltr', lang: 'en', label: 'English', className: 'font-sans leading-[1.5]' },
  es: { dir: 'ltr', lang: 'es', label: 'Español', className: 'font-sans leading-[1.5]' },
  fr: { dir: 'ltr', lang: 'fr', label: 'Français', className: 'font-sans leading-[1.5]' },
  de: { dir: 'ltr', lang: 'de', label: 'Deutsch', className: 'font-sans leading-[1.5]' },
  // One step smaller (0.9em) and much looser, or Nastaliq's descenders collide.
  ur: { dir: 'rtl', lang: 'ur', label: 'اردو', className: 'font-urdu text-[0.9em] leading-[2.1]' },
  ar: { dir: 'rtl', lang: 'ar', label: 'العربية', className: 'font-arabic leading-[1.9]' },
  zh: { dir: 'ltr', lang: 'zh-Hans', label: '中文', className: 'font-sc leading-[1.6]' },
  ja: { dir: 'ltr', lang: 'ja', label: '日本語', className: 'font-jp leading-[1.6]' },
}

const DEFAULT: LanguageCode = 'en'

/** Normalises "ur-PK", "ZH_hans", " en " to a supported code. */
export function normalizeLanguage(code: string | null | undefined): LanguageCode {
  if (!code) return DEFAULT
  const base = code.trim().toLowerCase().replace('_', '-').split('-')[0]
  return base in LANGUAGES ? (base as LanguageCode) : DEFAULT
}

/**
 * Presentation for a language code. Unknown or missing codes fall back to
 * English rather than throwing — transcript language fields come from the
 * backend and can be null.
 */
export function i18nText(code: string | null | undefined): I18nText {
  return LANGUAGES[normalizeLanguage(code)]
}

/** True for scripts that must be laid out right to left. */
export function isRtl(code: string | null | undefined): boolean {
  return i18nText(code).dir === 'rtl'
}

/** Every supported language, for switchers. Labels are in their own script. */
export const SUPPORTED_LANGUAGES = (Object.keys(LANGUAGES) as LanguageCode[]).map((code) => ({
  code,
  ...LANGUAGES[code],
}))
