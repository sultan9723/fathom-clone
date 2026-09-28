'use client'

import { useState } from 'react'
import { askAI } from '@/lib/api'
import { i18nText, type LanguageCode } from '@/lib/i18n-text'
import { Button, Panel } from '@/components/ui'

/**
 * The meeting summary.
 *
 * There is no summary column in the database, so nothing is shown until one
 * is generated — DESIGN.md forbids placeholder content, and inventing an
 * overview would be worse than an honest empty state. Generating goes through
 * the existing Ask route with a summarising question, in the language the
 * transcript is being read in.
 */
export function SummaryPanel({
  meetingId,
  lang,
}: {
  meetingId: string
  lang: LanguageCode
}) {
  const [summary, setSummary] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const target = i18nText(lang)

  const generate = async () => {
    setStatus('loading')
    setMessage(null)
    try {
      const answer = await askAI(
        meetingId,
        `Summarise this meeting in ${target.label}. Give a short overview, then the key points and any decisions. Answer only in ${target.label}.`
      )
      setSummary(answer)
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setMessage((error as Error).message)
    }
  }

  return (
    <Panel as="section" aria-labelledby="summary-heading" className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="summary-heading" className="text-label-sm uppercase text-faint">
          Summary
        </h2>
        {summary && (
          <Button variant="secondary" onClick={generate} disabled={status === 'loading'}>
            Regenerate
          </Button>
        )}
      </div>

      {summary ? (
        <p
          dir={target.dir}
          lang={target.lang}
          className={`${target.className} mt-4 whitespace-pre-wrap text-body-sm text-text-2 motion-safe:animate-enter`}
        >
          {summary}
        </p>
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
            {status === 'loading' ? 'Writing…' : `Summarise in ${target.label}`}
          </Button>
        </div>
      )}

      {status === 'error' && (
        <p role="alert" className="mt-3 text-small text-warn">
          {message}
        </p>
      )}
    </Panel>
  )
}
