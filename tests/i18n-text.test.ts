import { describe, it, expect } from 'vitest'
import {
  i18nText,
  isRtl,
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '../lib/i18n-text'

describe('i18nText', () => {
  it('covers every language the design system names', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code).sort()
    expect(codes).toEqual(['ar', 'de', 'en', 'es', 'fr', 'ja', 'ur', 'zh'])
  })

  it('marks Urdu and Arabic as RTL and everything else as LTR', () => {
    expect(isRtl('ur')).toBe(true)
    expect(isRtl('ar')).toBe(true)
    for (const code of ['en', 'es', 'fr', 'de', 'zh', 'ja'] as LanguageCode[]) {
      expect(isRtl(code)).toBe(false)
    }
  })

  it('gives Urdu Nastaliq at ~2.1 line height and one step smaller', () => {
    const ur = i18nText('ur')
    expect(ur.className).toContain('font-urdu')
    expect(ur.className).toContain('leading-[2.1]')
    expect(ur.className).toContain('text-[0.9em]')
  })

  it('gives Arabic Naskh, not Nastaliq', () => {
    expect(i18nText('ar').className).toContain('font-arabic')
    expect(i18nText('ar').className).not.toContain('font-urdu')
  })

  it('gives Chinese and Japanese ~1.6 line height and their own faces', () => {
    expect(i18nText('zh').className).toContain('font-sc')
    expect(i18nText('zh').className).toContain('leading-[1.6]')
    expect(i18nText('ja').className).toContain('font-jp')
    expect(i18nText('ja').className).toContain('leading-[1.6]')
  })

  it('labels each language in its own script', () => {
    expect(i18nText('ur').label).toBe('اردو')
    expect(i18nText('zh').label).toBe('中文')
    expect(i18nText('es').label).toBe('Español')
    expect(i18nText('en').label).toBe('English')
  })

  it('emits a BCP 47 tag, using zh-Hans for simplified Chinese', () => {
    expect(i18nText('zh').lang).toBe('zh-Hans')
    expect(i18nText('ur').lang).toBe('ur')
  })

  it('normalises regional and malformed codes', () => {
    expect(normalizeLanguage('ur-PK')).toBe('ur')
    expect(normalizeLanguage('ZH_hans')).toBe('zh')
    expect(normalizeLanguage('  en  ')).toBe('en')
  })

  it('falls back to English for null, empty or unknown codes', () => {
    // Transcript language fields come from the backend and can be null.
    expect(normalizeLanguage(null)).toBe('en')
    expect(normalizeLanguage(undefined)).toBe('en')
    expect(normalizeLanguage('')).toBe('en')
    expect(normalizeLanguage('klingon')).toBe('en')
    expect(i18nText(null).dir).toBe('ltr')
  })
})
