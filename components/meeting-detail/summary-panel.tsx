'use client'

import { useState } from 'react'
import { askAI } from '@/lib/api'
import { i18nText, type LanguageCode } from '@/lib/i18n-text'
import { Button, Panel } from '@/components/ui'
import { Markdown } from '@/components/ui/markdown'

/**
 * The meeting summary.
 *
 * There is no summary column in the database, so nothing is shown until one
 * is generated — DESIGN.md forbids placeholder content, and inventing an
 * overview would be worse than an honest empty state. Generating goes through
 * the existing Ask route with a summarizing question, in the language the
 * transcript is being read in.
 */
export function SummaryPanel({
  meetingId,
  lang,
  onSummaryChange,
}: {
  meetingId: string
  lang: LanguageCode
  /** Lets the page share the summary with Export and Share recap. */
  onSummaryChange?: (summary: string) => void
}) {
  const [summary, setSummary] = useState<string | null>(null)
  // The language the summary on screen was actually written in. Rendering it
  // with the currently selected language instead would flip an English
  // summary to RTL the moment someone switched the transcript to Urdu.
  const [summaryLang, setSummaryLang] = useState<LanguageCode>(lang)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const written = i18nText(summaryLang)
  const stale = summary !== null && summaryLang !== lang

  const generate = async () => {
    const requested = lang
    setStatus('loading')
    setMessage(null)
    try {
      const answer = await askAI(
        meetingId,
        `Summarize this meeting in ${i18nText(requested).label}. Give a short overview, then the key points and any decisions. Answer only in ${i18nText(requested).label}.`
      )
      setSummary(answer)
      setSummaryLang(requested)
      onSummaryChange?.(answer)
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setMessage((error as Error).message)
    }
  }

  return (
    <Panel as="section" aria-labelledby="summary-heading" className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="summary-heading" className="text-caption uppercase text-faint">
          Summary
        </h2>
        {summary && (
          <Button variant="secondary" onClick={generate} disabled={status === 'loading'}>
            {status === 'loading' ? 'Writing…' : stale ? 'Summarize' : 'Regenerate'}
          </Button>
        )}
      </div>

      <div aria-live="polite" aria-busy={status === 'loading'}>
      {summary ? (
        <Markdown
          text={summary}
          dir={written.dir}
          lang={written.lang}
          className={`${written.className} mt-4 text-body text-text-2 motion-safe:animate-enter`}
        />
      ) : (
        <div className="mt-4">
          <p className="text-small text-muted">
            No summary yet. NoteAI can write one from the transcript.
          </p>
          <Button
            variant="primary"
            onClick={generate}
            disabled={status === 'loading'}
            className="mt-4"
          >
            {status === 'loading' ? 'Writing…' : 'Summarize'}
          </Button>
        </div>
      )}
      </div>

      {status === 'error' && (
        <p role="alert" className="mt-3 text-small text-warn">
          {message}
        </p>
      )}
    </Panel>
  )
}
