import type { Metadata } from 'next'
import { SearchX } from 'lucide-react'
import { getMeetingRepository } from '@/lib/repository'
import { MeetingCard } from '@/components/meeting-list/meeting-card'
import { SearchInput } from '@/components/meeting-list/search-input'

export const metadata: Metadata = {
  title: 'Meetings · Fathom Clone',
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
  const meetings = await repo.list({ search: q })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Meetings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? `${meetings.length} ${meetings.length === 1 ? 'result' : 'results'} for “${q}”`
              : `${meetings.length} recorded ${meetings.length === 1 ? 'meeting' : 'meetings'}`}
          </p>
        </div>
        <SearchInput initialQuery={q} />
      </header>

      {meetings.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-16 text-center">
          <SearchX className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-900">No meetings found</p>
          <p className="mt-1 text-sm text-slate-500">
            Nothing matches “{q}”. Try a different search.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="flex">
              <MeetingCard meeting={meeting} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
