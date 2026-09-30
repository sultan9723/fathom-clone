'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ApiTranscript } from '@/lib/types'
import { getMeetingTranslations } from '@/lib/api'
import { formatTimecode } from '@/lib/utils'
import { i18nText, normalizeLanguage, type LanguageCode } from '@/lib/i18n-text'
import { useScramble } from '@/lib/scramble'
import { Button, Panel, SegmentedControl } from '@/components/ui'
import { speakerOrder, buildTurns } from './speaker-timeline'

/**
 * The transcript, with a "Read in" switch.
 *
 * Choosing a language other than the original fetches the whole transcript in
 * one call (the backend caches per line, so switching back is instant) and
 * shows the translation alongside the original — DESIGN.md's rule is that a
 * translation never replaces the source, it sits with it.
 *
 * A failed translation is not a dead end: the original stays on screen with a
 * notice and a retry, which is why the endpoint returns a real error status
 * rather than a body that looks like a translation.
 */

const READ_IN: { value: LanguageCode; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ur', label: 'اردو' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'ES' },
]

const SPEAKER_TEXT = ['text-speaker-1', 'text-speaker-2', 'text-speaker-3']

type Status = 'idle' | 'loading' | 'error'

export function TranscriptPanel({
  meetingId,
  transcripts,
  durationSeconds,
  onLanguageChange,
}: {
  meetingId: string
  transcripts: ApiTranscript[]
  durationSeconds: number
  /** Lets the page tell the Ask panel which language to answer in. */
  onLanguageChange?: (lang: LanguageCode) => void
}) {
  // The language the transcript was recorded in; "Read in EN" means original
  // when that is English, so no request is made for it.
  const sourceLang = normalizeLanguage(transcripts[0]?.original_language ?? 'en')

  const [lang, setLang] = useState<LanguageCode>(sourceLang)
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const showingOriginal = lang === sourceLang

  useEffect(() => {
    if (showingOriginal) {
      setStatus('idle')
      setMessage(null)
      return
    }

    let cancelled = false
    setStatus('loading')
    setMessage(null)

    getMeetingTranslations(meetingId, lang)
      .then((result) => {
        if (cancelled) return
        setTranslations(
          Object.fromEntries(result.lines.map((line) => [line.line_id, line.text]))
        )
        setStatus('idle')
      })
      .catch((error: Error) => {
        if (cancelled) return
        setStatus('error')
        setMessage(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [meetingId, lang, showingOriginal, attempt])

  const choose = useCallback(
    (next: LanguageCode) => {
      setLang(next)
      setTranslations({})
      onLanguageChange?.(next)
    },
    [onLanguageChange]
  )

  const speakers = speakerOrder(buildTurns(transcripts, durationSeconds))
  const target = i18nText(lang)
  // Only animate a translation that has just arrived, never the original.
  const animating = !showingOriginal && status === 'idle'

  return (
    <Panel as="section" aria-labelledby="transcript-heading" className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="transcript-heading" className="text-label-sm uppercase text-faint">
          Transcript
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-small text-muted">Read in</span>
          <SegmentedControl
            label="Read the transcript in"
            options={READ_IN.map((option) => ({ ...option, lang: option.value }))}
            value={lang}
            onChange={choose}
          />
        </div>
      </div>

      {status === 'loading' && (
        <p role="status" className="mt-4 text-small text-muted">
          Translating into {target.label}…
        </p>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-card border border-warn-border bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-body-sm font-medium text-warn">Showing the original for now</p>
            <p className="mt-1 text-small text-muted">{message}</p>
          </div>
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={() => {
              setStatus('loading')
              setAttempt((value) => value + 1)
            }}
          >
            Retry
          </Button>
        </div>
      )}

      <ol className="mt-5 space-y-5">
        {transcripts.map((line, index) => (
          <TranscriptLine
            key={line.id}
            line={line}
            index={index}
            speakerIndex={Math.max(speakers.indexOf(line.speaker_name?.trim() || 'Unknown'), 0)}
            translation={translations[line.id]}
            lang={lang}
            sourceLang={sourceLang}
            animate={animating}
          />
        ))}
      </ol>
    </Panel>
  )
}

function TranscriptLine({
  line,
  index,
  speakerIndex,
  translation,
  lang,
  sourceLang,
  animate,
}: {
  line: ApiTranscript
  index: number
  speakerIndex: number
  translation?: string
  lang: LanguageCode
  sourceLang: LanguageCode
  animate: boolean
}) {
  const target = i18nText(lang)
  const source = i18nText(sourceLang)
  // The scramble runs on the translation as it arrives; with none, this is
  // just the empty string and nothing animates.
  const shown = useScramble({
    text: translation ?? '',
    lang,
    index,
    disabled: !animate || !translation,
  })

  return (
    <li className="grid grid-cols-[3.5rem_1fr] gap-3">
      <span className="pt-0.5 font-mono text-label-sm tabular-nums text-faint">
        {formatTimecode(line.timestamp_seconds)}
      </span>

      <div className="min-w-0">
        <span
          className={`text-small font-medium ${SPEAKER_TEXT[speakerIndex % SPEAKER_TEXT.length]}`}
        >
          {line.speaker_name?.trim() || 'Unknown'}
        </span>

        {translation ? (
          // Translation leads, original stays with it — muted and smaller.
          <div className="mt-1 grid gap-2 md:grid-cols-2 md:gap-6">
            <p dir={target.dir} lang={target.lang} className={`${target.className} text-body-sm text-text`}>
              {shown}
            </p>
            <p
              dir={source.dir}
              lang={source.lang}
              className={`${source.className} text-small text-muted md:border-l md:border-border-subtle md:pl-6`}
            >
              {line.text}
            </p>
          </div>
        ) : (
          <p
            dir={source.dir}
            lang={source.lang}
            className={`${source.className} mt-1 text-body-sm text-text`}
          >
            {line.text}
          </p>
        )}
      </div>
    </li>
  )
}
