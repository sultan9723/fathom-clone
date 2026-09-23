import type { Metadata } from 'next'
import { SearchX } from 'lucide-react'
import { getMeetingRepository } from '@/lib/repository'
import { MeetingCard } from '@/components/meeting-list/meeting-card'
import { AskSidebar } from '@/components/meeting-list/ask-sidebar'

export const metadata: Metadata = {
  title: 'Meetings',
  description: 'Recorded meetings with transcripts, summaries and action items.',
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const repo = getMeetingRepository()
  // Filtering lives in the repository so it moves to a WHERE clause unchanged.
  const [meetings, allMeetings] = await Promise.all([
    repo.list({ search: q }),
    q ? repo.list() : Promise.resolve(undefined),
  ])
  // Ask sidebar's scope dropdown must offer every meeting, independent of
  // the current search filter.
  const sidebarMeetings = (allMeetings ?? meetings).map((m) => ({ id: m.id, title: m.title }))

  return (
    <div className="flex min-h-[calc(100vh-100px)] w-full">
      <main className="flex-1 overflow-y-auto px-6 pb-10">
        <header className="flex flex-col gap-2 pt-8">
          <h1 className="text-3xl font-semibold text-fg-1">Meetings</h1>
          <p className="text-sm text-fg-meta">
            {q
              ? `${meetings.length} ${meetings.length === 1 ? 'result' : 'results'} for "${q}"`
              : `${meetings.length} recorded ${meetings.length === 1 ? 'meeting' : 'meetings'}`}
          </p>
        </header>

        {meetings.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
            <SearchX className="h-8 w-8 text-fg-3" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-fg-1">No meetings found</p>
            <p className="mt-1 text-sm text-fg-3">
              Nothing matches &quot;{q}&quot;. Try a different search.
            </p>
          </div>
        ) : (
          <div className="@container mt-6">
            <ul className="grid grid-cols-1 gap-4 @[700px]:grid-cols-2 @[950px]:grid-cols-3 @[1200px]:grid-cols-4">
              {meetings.map((meeting) => (
                <li key={meeting.id}>
                  <MeetingCard meeting={meeting} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <AskSidebar meetings={sidebarMeetings} />
    </div>
  )
}
