'use client'

/**
 * Translates a meeting's transcript into another language on demand via
 * POST /api/v1/ai/translate.
 *
 * As with the Ask panel, the backend answers 200 even when no provider is
 * configured — the notice arrives in `translated`, so it is detected here and
 * shown as a notice rather than presented as a translation.
 */

import { useState } from 'react'
import { Languages, Loader2 } from 'lucide-react'
import { translateText } from '@/lib/api'

const LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Spanish' },
  { code: 'FR', name: 'French' },
  { code: 'DE', name: 'German' },
  { code: 'ZH', name: 'Chinese' },
  { code: 'JA', name: 'Japanese' },
  { code: 'AR', name: 'Arabic' },
  { code: 'PT', name: 'Portuguese' },
] as const

/** Matches the backend's "no provider" and "provider failed" notices. */
function isNotice(translated: string): boolean {
  return (
    translated.startsWith('Translation not configured') ||
    translated.startsWith('Translation unavailable')
  )
}

export function NoteAiTranslator({
  transcriptText,
  sourceLang = 'EN',
}: {
  transcriptText: string
  sourceLang?: string
}) {
  const [targetLang, setTargetLang] = useState('ES')
  const [translated, setTranslated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const hasText = transcriptText.trim().length > 0

  async function handleTranslate() {
    if (!hasText || loading) return
    setLoading(true)
    setError(null)
    setTranslated(null)
    try {
      const result = await translateText({
        text: transcriptText,
        source_lang: sourceLang,
        target_lang: targetLang,
      })
      setTranslated(result.translated)
    } catch {
      setError('Translation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-labelledby="translate-heading" className="mt-6 border-t border-line pt-6">
      <h3 id="translate-heading" className="mb-4 text-xl font-bold text-fg-1">
        Translate Transcript
      </h3>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="target-lang" className="sr-only">
          Target language
        </label>
        <select
          id="target-lang"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          // text-lg is 16px in this project's remapped scale — the floor iOS
          // needs to avoid zooming the page on focus.
          className="rounded-md border border-line bg-white px-3 py-2 text-lg text-fg-1 transition-all duration-200 focus:border-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleTranslate}
          disabled={loading || !hasText}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-md font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-brand-hover disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Languages className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? 'Translating…' : 'Translate'}
        </button>

        {!hasText && <span className="text-base text-fg-3">Nothing to translate yet.</span>}
      </div>

      {error && <p className="mb-4 text-md text-red-600">{error}</p>}

      {translated && isNotice(translated) && (
        <div className="animate-fadein rounded-md border border-line bg-surface-1 p-4">
          <p className="text-md font-medium text-fg-1">Translation not available</p>
          <p className="mt-1 text-base text-fg-2">
            Set GROQ_API_KEY, ANTHROPIC_API_KEY or OPENAI_API_KEY on the backend to enable
            translation.
          </p>
          <p className="mt-2 break-words font-mono text-xs text-fg-3">{translated}</p>
        </div>
      )}

      {translated && !isNotice(translated) && (
        <div
          className="grid animate-fadein grid-cols-1 gap-4 lg:grid-cols-2"
          aria-live="polite"
        >
          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-3">
              Original ({sourceLang})
            </p>
            <p className="whitespace-pre-wrap text-md leading-6 text-fg-1">{transcriptText}</p>
          </div>

          {/* The requested "dark accent" panel — a deliberate contrast pop
              against the light theme everywhere else, marking this as the
              AI-generated output. */}
          <div className="rounded-lg border border-cyan/30 bg-[#0a0e14] p-4 shadow-[0_0_20px_rgba(0,212,255,0.08)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan">
              Translated ({targetLang})
            </p>
            <p className="whitespace-pre-wrap text-md leading-6 text-white">{translated}</p>
          </div>
        </div>
      )}
    </section>
  )
}
