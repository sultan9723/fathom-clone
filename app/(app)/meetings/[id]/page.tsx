'use client'

/**
 * Meeting detail. Every panel reads the API — there is no seed data behind
 * this page, and nothing renders that the backend didn't supply.
 *
 * The language chosen in the transcript's "Read in" control is held here
 * rather than inside the transcript, because the summary and Ask panels
 * answer in it too.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import type { ApiActionItem, ApiMeeting, ApiTranscript } from '@/lib/types'
import { getActionItems, getMeeting, getTranscripts } from '@/lib/api'
import { formatDuration, formatMeetingDate } from '@/lib/utils'
import { normalizeLanguage, type LanguageCode } from '@/lib/i18n-text'
import { Badge, Button, Panel } from '@/components/ui'
import { SpeakerTimeline } from '@/components/meeting-detail/speaker-timeline'
import { TranscriptPanel } from '@/components/meeting-detail/transcript-panel'
import { SummaryPanel } from '@/components/meeting-detail/summary-panel'
import { ActionItemsPanel } from '@/components/meeting-detail/action-items-panel'
import { AskPanel } from '@/components/meeting-detail/ask-panel'

const IN_PROGRESS_WINDOW_MS = 2 * 60 * 60 * 1000

/**
 * The backend serialises created_at without a zone suffix, and `new Date()`
 * reads a bare timestamp as local time — which badly skews "was this just
 * now". Force UTC when no designator is present.
 */
function parseUtc(iso: string): Date {
  return new Date(/[Zz]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
}

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>()
  const meetingId = params?.id ?? ''

  const [meeting, setMeeting] = useState<ApiMeeting | null>(null)
  const [transcripts, setTranscripts] = useState<ApiTranscript[]>([])
  const [actionItems, setActionItems] = useState<ApiActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [lang, setLang] = useState<LanguageCode>('en')

  useEffect(() => {
    if (!meetingId) return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(false)
      try {
        // The meeting must exist before its children are worth fetching; the
        // two child calls are independent of each other.
        const loaded = await getMeeting(meetingId)
        if (cancelled) return
        setMeeting(loaded)
        setLang(normalizeLanguage(loaded.languages?.split(',')[0] ?? 'en'))

        const [lines, items] = await Promise.all([
          getTranscripts(meetingId).catch(() => [] as ApiTranscript[]),
          getActionItems(meetingId).catch(() => [] as ApiActionItem[]),
        ])
        if (cancelled) return
        setTranscripts(lines)
        setActionItems(items)
      } catch {
        if (!cancelled) {
          setError(true)
          setMeeting(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [meetingId, attempt])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1100px]">
        <BackLink />
        <p role="status" className="mt-8 text-body-sm text-muted">
          Loading this meeting…
        </p>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="mx-auto w-full max-w-[1100px]">
        <BackLink />
        <Panel className="mt-6 border-warn-border px-6 py-12 text-center">
          <h1 className="text-title font-semibold text-warn">We couldn&rsquo;t load this meeting</h1>
          <p className="mx-auto mt-2 max-w-sm text-body-sm text-muted">
            The connection to the server failed.
          </p>
          <Button variant="secondary" onClick={retry} className="mt-6">
            Try again
          </Button>
        </Panel>
      </div>
    )
  }

  const live = Date.now() - parseUtc(meeting.created_at).getTime() < IN_PROGRESS_WINDOW_MS

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <BackLink />

      <header className="mt-4 border-b border-border-subtle pb-6">
        {live && <Badge variant="live">Live</Badge>}
        <h1 className={`text-h1 text-text ${live ? 'mt-3' : ''}`}>{meeting.title}</h1>
        {meeting.description && (
          <p className="mt-2 max-w-prose text-body-sm text-muted">{meeting.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-faint">
          <span>{formatMeetingDate(meeting.created_at)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {meeting.speaker_count} {meeting.speaker_count === 1 ? 'speaker' : 'speakers'}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(meeting.duration_seconds)}</span>
        </div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-5">
          {transcripts.length > 0 && (
            <SpeakerTimeline
              transcripts={transcripts}
              durationSeconds={meeting.duration_seconds}
            />
          )}

          {transcripts.length > 0 ? (
            <TranscriptPanel
              meetingId={meeting.id}
              transcripts={transcripts}
              durationSeconds={meeting.duration_seconds}
              onLanguageChange={setLang}
            />
          ) : (
            <Panel className="p-5">
              <h2 className="text-label-sm uppercase text-faint">Transcript</h2>
              <p className="mt-3 text-small text-muted">
                No transcript was recorded for this meeting.
              </p>
            </Panel>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-7">
          <SummaryPanel meetingId={meeting.id} lang={lang} />
          <ActionItemsPanel
            meetingId={meeting.id}
            items={actionItems}
            onItemsChange={setActionItems}
          />
          <AskPanel meetingId={meeting.id} lang={lang} />
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/meetings"
      className="inline-flex items-center gap-1 rounded-chip text-small text-muted transition-colors duration-fast ease-out-design hover:text-text"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      Meetings
    </Link>
  )
}
