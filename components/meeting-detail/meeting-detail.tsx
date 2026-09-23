'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { PlayerProvider } from './player-provider'
import { VideoPlayer } from './video-player'
import { TranscriptPanel } from './transcript-panel'
import { SummaryPanel } from './summary-panel'
import { ActionItems } from './action-items'
import { Highlights } from './highlights'
import { Participants } from './participants'
import { PlatformBadge } from '@/components/meeting-list/platform-badge'
import { ShareModal } from '@/components/share/share-modal'
import { formatDuration, formatMeetingDate, formatMeetingTime } from '@/lib/utils'

/**
 * Client shell for the detail view. The page itself stays a Server Component
 * that loads the meeting; everything below here needs the shared player
 * context, so the boundary sits at exactly one place.
 */
export function MeetingDetail({
  meeting,
  initialTime = 0,
}: {
  meeting: Meeting
  initialTime?: number
}) {
  return (
    <PlayerProvider durationSec={meeting.durationSec} initialTime={initialTime}>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1.5 rounded text-sm text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All meetings
        </Link>

        <header className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {meeting.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
              <PlatformBadge platform={meeting.platform} />
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {formatMeetingDate(meeting.date)} · {formatMeetingTime(meeting.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDuration(meeting.durationSec)}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <ShareModal meetingId={meeting.id} title={meeting.title} />
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <VideoPlayer
              src={meeting.videoUrl}
              poster={meeting.thumbnailUrl}
              title={meeting.title}
              highlights={meeting.highlights}
            />
            <SummaryPanel summary={meeting.summary} />
            <ActionItems items={meeting.actionItems} participants={meeting.participants} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Highlights highlights={meeting.highlights} />
              <Participants
                participants={meeting.participants}
                transcript={meeting.transcript}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-20">
            <TranscriptPanel
              transcript={meeting.transcript}
              participants={meeting.participants}
            />
          </div>
        </div>
      </main>
    </PlayerProvider>
  )
}
