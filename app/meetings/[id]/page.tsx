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
import { ChevronLeft } from 'lucide-react'
import type { ApiActionItem, ApiMeeting, ApiTranscript } from '@/lib/types'
import { getActionItems, getMeeting, getTranscripts } from '@/lib/api'
import { cn, formatDuration, formatMeetingDate, formatTimecode } from '@/lib/utils'
import { PlayerProvider, usePlayer } from '@/components/meeting-detail/player-provider'
import { NoteAiTranscript } from '@/components/meeting-detail/noteai-transcript'
import { NoteAiActionItems } from '@/components/meeting-detail/noteai-action-items'
import { NoteAiSummary } from '@/components/meeting-detail/noteai-summary'
import { NoteAiAsk } from '@/components/meeting-detail/noteai-ask'
import { NoteAiVideoPlayer } from '@/app/components/meeting-detail/noteai-video-player'
import { MeetingDetailSkeleton, MeetingEmptyState, MeetingLoadError, MeetingPanelBoundary, TranscriptSkeleton } from '@/components/meeting-list/premium-feedback'

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
  const [attempt, setAttempt] = useState(0)
  const [transcriptLoading, setTranscriptLoading] = useState(true)
  const [actionsLoading, setActionsLoading] = useState(true)
  const [transcriptError, setTranscriptError] = useState(false)
  const [actionsError, setActionsError] = useState(false)

  useEffect(() => {
    if (!meetingId) return
    let cancelled = false

    ;(async () => {
      setError(null)
      setTranscriptLoading(true)
      setActionsLoading(true)
      setTranscriptError(false)
      setActionsError(false)
      setTranscripts([])
      setActionItems([])
      try {
        // The meeting must exist before its children are worth fetching, but
        // the two child calls are independent of each other.
        const m = await getMeeting(meetingId)
        if (cancelled) return
        setMeeting(m)
        setLoading(false)
        // Each panel can finish or fail independently; metadata stays usable.
        await Promise.all([
          getTranscripts(meetingId).then(
            (items) => { if (!cancelled) setTranscripts(items) },
            () => { if (!cancelled) setTranscriptError(true) },
          ).finally(() => { if (!cancelled) setTranscriptLoading(false) }),
          getActionItems(meetingId).then(
            (items) => { if (!cancelled) setActionItems(items) },
            () => { if (!cancelled) setActionsError(true) },
          ).finally(() => { if (!cancelled) setActionsLoading(false) }),
        ])
      } catch {
        if (cancelled) return
        setError('We couldn’t load this meeting')
        setMeeting(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [meetingId, attempt])

  const retry = () => { setLoading(!meeting); setAttempt((value) => value + 1) }

  if (loading || (meeting && meeting.id !== meetingId)) {
    return <MeetingDetailSkeleton />
  }

  if (error || !meeting) {
    return (
      <div className="px-4 py-10 sm:px-6">
        <MeetingLoadError title={error ?? 'Meeting not found'} onRetry={retry} />
        <Link href="/meetings" className="mt-3 inline-block text-md text-brand hover:underline">
          Back to meetings
        </Link>
      </div>
    )
  }

  return (
    <PlayerProvider key={meeting.id} durationSec={meeting.duration_seconds}>
      <MeetingDetailView
        meeting={meeting}
        transcripts={transcripts}
        actionItems={actionItems}
        onActionItemsChange={setActionItems}
        transcriptLoading={transcriptLoading}
        actionsLoading={actionsLoading}
        transcriptError={transcriptError}
        actionsError={actionsError}
        onRetry={retry}
      />
    </PlayerProvider>
  )
}

function MeetingDetailView({
  meeting,
  transcripts,
  actionItems,
  onActionItemsChange,
  transcriptLoading,
  actionsLoading,
  transcriptError,
  actionsError,
  onRetry,
}: {
  meeting: ApiMeeting
  transcripts: ApiTranscript[]
  actionItems: ApiActionItem[]
  onActionItemsChange: (items: ApiActionItem[]) => void
  transcriptLoading: boolean
  actionsLoading: boolean
  transcriptError: boolean
  actionsError: boolean
  onRetry: () => void
}) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''
  // A ?q= link comes from search, so open on the tab that shows the matches.
  const [tab, setTab] = useState<Tab>(query ? 'transcript' : 'summary')

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 motion-safe:animate-fadein sm:px-6">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-base text-fg-2 transition-colors hover:text-brand"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        All meetings
      </Link>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left: header, player placeholder, clock */}
        <div className="flex w-full shrink-0 flex-col gap-4 rounded-lg border border-line bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] lg:w-[40%]">
          <MeetingHeader meeting={meeting} />
          <MeetingPanelBoundary title="The recording player needs another try">
            <NoteAiVideoPlayer />
          </MeetingPanelBoundary>
          <CurrentPosition />
        </div>

        {/* Middle: tabbed content */}
        <div className="min-w-0 flex-1">
          <div
            role="tablist"
            aria-label="Meeting sections"
            className="flex gap-6 overflow-x-auto border-b-2 border-line"
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
                  'relative shrink-0 pb-3 text-md font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan',
                  tab === id
                    ? 'text-fg-1 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-cyan after:shadow-[0_0_8px_rgba(0,212,255,0.6)]'
                    : 'text-fg-3 hover:text-fg-1'
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
            className="mt-4 rounded-lg border border-line bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
          >
            <MeetingPanelBoundary key={tab} title="This meeting section needs another try">
            {tab === 'summary' && <NoteAiSummary meeting={meeting} />}
            {tab === 'transcript' && (
              transcriptLoading ? <TranscriptSkeleton /> :
              transcriptError ? <MeetingLoadError title="We couldn’t load the transcript" onRetry={onRetry} /> :
              transcripts.length === 0 ? <MeetingEmptyState kind="transcript" /> :
              <div className="motion-safe:animate-fadein">
              <NoteAiTranscript
                transcripts={transcripts}
                query={query}
                // `languages` is a comma list ("en,es"); the translator needs
                // one code, so take the first as the source language.
                sourceLang={meeting.languages?.split(',')[0]?.trim().toUpperCase() || 'EN'}
              />
              </div>
            )}
            {tab === 'action-items' && (
              actionsLoading ? <TranscriptSkeleton label="Loading action items" /> :
              actionsError ? <MeetingLoadError title="We couldn’t load action items" onRetry={onRetry} /> :
              actionItems.length === 0 ? <MeetingEmptyState kind="action-items" /> :
              <div className="motion-safe:animate-fadein">
              <NoteAiActionItems
                meetingId={meeting.id}
                items={actionItems}
                onItemsChange={onActionItemsChange}
              />
              </div>
            )}
            </MeetingPanelBoundary>
          </div>
        </div>

        {/* Right: Ask — full width under the rest on mobile */}
        <div className="w-full shrink-0 lg:w-[320px]">
          <MeetingPanelBoundary title="The assistant needs another try">
            <NoteAiAsk meetingId={meeting.id} />
          </MeetingPanelBoundary>
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
