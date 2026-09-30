'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { i18nText, normalizeLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n-text'

const PreferenceContext = createContext<{ language: LanguageCode; setLanguage: (language: LanguageCode) => void; saved: boolean }>({ language: 'en', setLanguage: () => {}, saved: true })

export function ProductPreferences({ children }: { children: ReactNode }) {
  const [language, update] = useState<LanguageCode>('en')
  const [saved, setSaved] = useState(true)
  useEffect(() => {
    try { update(normalizeLanguage(localStorage.getItem('noteai.reading-language'))) } catch { setSaved(false) }
  }, [])
  function setLanguage(next: LanguageCode) {
    update(next)
    try { localStorage.setItem('noteai.reading-language', next); setSaved(true) } catch { setSaved(false) }
  }
  return <PreferenceContext.Provider value={{ language, setLanguage, saved }}>{children}</PreferenceContext.Provider>
}

export const useReadingLanguage = () => useContext(PreferenceContext)

export function LanguageSelect({ id = 'reading-language', value, onChange, label = 'Reading language' }: {
  id?: string; value: LanguageCode; onChange: (language: LanguageCode) => void; label?: string
}) {
  return <label className="product-field language-field" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={event => onChange(normalizeLanguage(event.target.value))}>{SUPPORTED_LANGUAGES.map(language => <option key={language.code} value={language.code} lang={language.lang}>{language.label}</option>)}</select></label>
}

export function ScriptText({ language, children, className = '' }: { language: string; children: ReactNode; className?: string }) {
  const { lang, dir, className: script } = i18nText(language)
  return <span lang={lang} dir={dir} className={`script-text ${script} ${className}`}>{children}</span>
}
