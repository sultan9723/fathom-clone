'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Meeting } from '@/lib/types'
import { PlayerProvider } from './player-provider'
import { VideoPlayer } from './video-player'
import { SubNavTabs, type DetailTab } from './sub-nav-tabs'
import { SummaryTab } from './summary-tab'
import { TranscriptPanel } from './transcript-panel'
import { AskPanel } from './ask-panel'
import { NotesColumn } from './notes-column'
import { NotesContent } from './notes-content'

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
  const [activeTab, setActiveTab] = useState<DetailTab>('summary')

  return (
    <PlayerProvider durationSec={meeting.durationSec} initialTime={initialTime}>
      <div className="flex w-full items-start">
        <div className="min-w-0 flex-grow">
          <Link
            href="/meetings"
            className="mt-2 inline-flex items-center gap-0.5 px-4 text-xs text-fg-meta transition hover:text-fg-2 sm:px-6"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            My Calls
          </Link>

          <div className="px-4 sm:px-6">
            <VideoPlayer
              src={meeting.videoUrl}
              poster={meeting.thumbnailUrl}
              title={meeting.title}
              date={meeting.date}
              highlights={meeting.highlights}
            />
          </div>

          <SubNavTabs active={activeTab} onChange={setActiveTab} meeting={meeting} />

          {activeTab === 'summary' && <SummaryTab meeting={meeting} />}
          {activeTab === 'transcript' && (
            <TranscriptPanel transcript={meeting.transcript} participants={meeting.participants} />
          )}
          {activeTab === 'ask' && <AskPanel meetingId={meeting.id} />}
          {activeTab === 'details' && (
            // Same content as the persistent NotesColumn (lg+); this pane
            // is how mobile reaches it, so it disappears once that column
            // is visible instead of duplicating it on wide screens.
            <div className="bg-black px-4 py-5 lg:hidden">
              <NotesContent meeting={meeting} />
            </div>
          )}
        </div>

        <NotesColumn meeting={meeting} />
      </div>
    </PlayerProvider>
  )
}
