'use client'

/**
 * NoteAI meeting detail. All four panels read the FastAPI backend through
 * lib/api.ts — there is no seed data behind this page.
 *
 * Time state goes through PlayerProvider (CLAUDE.md), even though no <video>
 * is mounted: the placeholder player, the "currently at" readout, transcript
 * clicks and transcript scrolling all share its clock, so wiring a real
 * <video> later is a matter of attaching its ref.
 *
 * Font sizes follow this repo's token scale (lib/design-tokens.ts):
 * text-2xl = 22px, text-xl = 18px, text-md = 14px, text-base = 13px,
 * text-xs = 11px.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ChevronLeft, Loader2, Play } from 'lucide-react'
import type { ApiActionItem, ApiMeeting, ApiTranscript } from '@/lib/types'
import { getActionItems, getMeeting, getTranscripts } from '@/lib/api'
import { cn, formatDuration, formatMeetingDate, formatTimecode } from '@/lib/utils'
import { PlayerProvider, usePlayer } from '@/components/meeting-detail/player-provider'
import { NoteAiTranscript } from '@/components/meeting-detail/noteai-transcript'
import { NoteAiActionItems } from '@/components/meeting-detail/noteai-action-items'
import { NoteAiSummary } from '@/components/meeting-detail/noteai-summary'
import { NoteAiAsk } from '@/components/meeting-detail/noteai-ask'

type Tab = 'summary' | 'transcript' | 'action-items'

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'action-items', label: 'Action Items' },
]

/** "en,es" -> "EN · ES" */
function formatLanguages(languages: string | null): string {
  if (!languages) return ''
  return languages
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
    .join(' · ')
}

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>()
  const meetingId = params?.id ?? ''

  const [meeting, setMeeting] = useState<ApiMeeting | null>(null)
  const [transcripts, setTranscripts] = useState<ApiTranscript[]>([])
  const [actionItems, setActionItems] = useState<ApiActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!meetingId) return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // The meeting must exist before its children are worth fetching, but
        // the two child calls are independent of each other.
        const m = await getMeeting(meetingId)
        const [t, a] = await Promise.all([
          getTranscripts(meetingId),
          getActionItems(meetingId),
        ])
        if (cancelled) return
        setMeeting(m)
        setTranscripts(t)
        setActionItems(a)
      } catch {
        if (cancelled) return
        setError('Failed to load this meeting')
        setMeeting(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [meetingId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-10 text-md text-fg-3 sm:px-6">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading meeting…
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="px-4 py-10 sm:px-6">
        <p className="text-md text-red-600">{error ?? 'Meeting not found'}</p>
        <Link href="/meetings" className="mt-3 inline-block text-md text-brand hover:underline">
          Back to meetings
        </Link>
      </div>
    )
  }

  return (
    <PlayerProvider durationSec={meeting.duration_seconds}>
      <MeetingDetailView
        meeting={meeting}
        transcripts={transcripts}
        actionItems={actionItems}
        onActionItemsChange={setActionItems}
      />
    </PlayerProvider>
  )
}

function MeetingDetailView({
  meeting,
  transcripts,
  actionItems,
  onActionItemsChange,
}: {
  meeting: ApiMeeting
  transcripts: ApiTranscript[]
  actionItems: ApiActionItem[]
  onActionItemsChange: (items: ApiActionItem[]) => void
}) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''
  // A ?q= link comes from search, so open on the tab that shows the matches.
  const [tab, setTab] = useState<Tab>(query ? 'transcript' : 'summary')

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-base text-fg-2 transition-colors hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        All meetings
      </Link>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left: header, player placeholder, clock */}
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[40%]">
          <MeetingHeader meeting={meeting} />
          <VideoPlaceholder />
          <CurrentPosition />
        </div>

        {/* Middle: tabbed content */}
        <div className="min-w-0 flex-1">
          <div
            role="tablist"
            aria-label="Meeting sections"
            className="flex gap-6 overflow-x-auto border-b border-line"
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  'shrink-0 border-b-2 pb-2.5 text-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  tab === id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-fg-3 hover:text-fg-1'
                )}
              >
                {label}
                {id === 'action-items' && actionItems.length > 0 && (
                  <span className="ml-1.5 text-xs text-fg-meta">{actionItems.length}</span>
                )}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="pt-4"
          >
            {tab === 'summary' && <NoteAiSummary meeting={meeting} />}
            {tab === 'transcript' && (
              <NoteAiTranscript
                transcripts={transcripts}
                query={query}
                // `languages` is a comma list ("en,es"); the translator needs
                // one code, so take the first as the source language.
                sourceLang={meeting.languages?.split(',')[0]?.trim().toUpperCase() || 'EN'}
              />
            )}
            {tab === 'action-items' && (
              <NoteAiActionItems
                meetingId={meeting.id}
                items={actionItems}
                onItemsChange={onActionItemsChange}
              />
            )}
          </div>
        </div>

        {/* Right: Ask — full width under the rest on mobile */}
        <div className="w-full shrink-0 lg:w-[320px]">
          <NoteAiAsk meetingId={meeting.id} />
        </div>
      </div>
    </div>
  )
}

function MeetingHeader({ meeting }: { meeting: ApiMeeting }) {
  const languages = formatLanguages(meeting.languages)
  return (
    <header>
      <h1 className="text-2xl font-semibold leading-tight text-fg-1">{meeting.title}</h1>
      {meeting.description && (
        <p className="mt-2 text-md leading-5 text-fg-2">{meeting.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-meta">
        <span>{formatMeetingDate(meeting.created_at)}</span>
        <span aria-hidden="true">·</span>
        <span>
          {meeting.speaker_count} {meeting.speaker_count === 1 ? 'speaker' : 'speakers'}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatDuration(meeting.duration_seconds)}</span>
        {languages && (
          <>
            <span aria-hidden="true">·</span>
            <span>{languages}</span>
          </>
        )}
      </div>
    </header>
  )
}

/**
 * No recording is attached to a NoteAI meeting yet — the backend stores no
 * media URL. This is the shape the player will take, shown inert rather than
 * as a broken <video>.
 */
function VideoPlaceholder() {
  return (
    <div
      role="img"
      aria-label="No recording attached to this meeting"
      className="grid aspect-video w-full place-items-center rounded-md bg-black"
    >
      <div className="flex flex-col items-center gap-2">
        <Play className="h-12 w-12 text-white/40" aria-hidden="true" />
        <p className="text-xs text-white/50">No recording attached</p>
      </div>
    </div>
  )
}

/** Reads the shared clock — moved by transcript clicks and transcript scroll. */
function CurrentPosition() {
  const { currentTime, duration } = usePlayer()
  return (
    <p className="text-md text-fg-2">
      Currently at{' '}
      <span className="font-mono tabular-nums text-fg-1">{formatTimecode(currentTime)}</span>
      <span className="text-fg-meta"> / {formatTimecode(duration)}</span>
    </p>
  )
}
