import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Search } from 'lucide-react'
import { getMeetingRepository } from '@/lib/repository'
import { searchAcrossMeetings } from '@/lib/search'
import { SearchPageInput } from '@/components/search/search-page-input'
import { SearchResults } from '@/components/search/search-results'
import { SearchEmptyState } from '@/components/search/search-empty-state'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q = '' } = await searchParams
  return { title: q ? `Search results for "${q}"` : 'Search' }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const query = q.trim()

  const meetings = query ? await getMeetingRepository().getAll() : []
  const results = query ? searchAcrossMeetings(query, meetings) : []
  const meetingCount = new Set(results.map((r) => r.meetingId)).size

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-sm text-fg-meta transition hover:text-fg-2"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-fg-1">
        {query ? (
          <>
            Search Results for &quot;{query}&quot;
          </>
        ) : (
          'Search'
        )}
      </h1>

      <div className="mt-4">
        <SearchPageInput initialQuery={query} />
      </div>

      {query && (
        <p className="mt-3 text-base text-fg-3">
          {results.length} {results.length === 1 ? 'result' : 'results'} across{' '}
          {meetingCount} {meetingCount === 1 ? 'meeting' : 'meetings'}
        </p>
      )}

      <div className="mt-4">
        {!query ? (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <Search className="h-12 w-12 text-surface-5" aria-hidden="true" />
            <p className="mt-4 text-md text-fg-3">
              Search across every transcript in every meeting.
            </p>
          </div>
        ) : results.length === 0 ? (
          <SearchEmptyState query={query} />
        ) : (
          <SearchResults results={results} />
        )}
      </div>
    </main>
  )
}
