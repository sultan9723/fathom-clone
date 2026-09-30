'use client'

/**
 * Cross-meeting search. Reads ?q= and hits GET /api/v1/search, which matches
 * on meeting title, description, languages *and* transcript text — so a hit
 * here is not always visible in the card, which is why each result links
 * through with the query attached for the detail page to highlight.
 *
 * useSearchParams() lives in a child under <Suspense>: at the top level of a
 * client page it opts the whole route out of prerendering.
 *
 * Font sizes use this repo's token scale (lib/design-tokens.ts):
 * text-xl = 18px, text-md = 14px, text-base = 13px, text-xs = 11px. H1 is
 * 32px per DESIGN-NOTEAI.md, which has no token.
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import type { ApiMeeting } from '@/lib/types'
import { searchMeetings } from '@/lib/api'
import { SearchPageInput } from '@/components/search/search-page-input'

/** "en,es" -> "EN · ES" */
function formatLanguages(languages: string | null): string {
  if (!languages) return ''
  return languages
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
    .join(' · ')
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchShell query="" />}>
      <SearchView />
    </Suspense>
  )
}

function SearchView() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [results, setResults] = useState<ApiMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // searchMeetings already short-circuits a blank query without a request.
        const data = await searchMeetings(query)
        if (cancelled) return
        setResults(data)
      } catch {
        if (cancelled) return
        setError('Search failed')
        setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [query])

  const trimmed = query.trim()

  return (
    <SearchShell query={query}>
      {loading && <p className="text-md text-fg-2">Searching…</p>}

      {error && <p className="text-md text-red-600">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-md text-fg-3">
          {trimmed ? 'No results found' : 'Enter a search query above'}
        </p>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium text-fg-3">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((meeting) => (
            <Link
              key={meeting.id}
              // Carry the query through so the detail page highlights the
              // matching words — the match is often only in the transcript.
              href={`/meetings/${meeting.id}?q=${encodeURIComponent(trimmed)}`}
              className="group block rounded-lg border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-[0_8px_20px_rgba(0,212,255,0.14)]"
            >
              <h3 className="text-xl font-bold text-fg-1 transition-colors group-hover:text-brand">
                {meeting.title}
              </h3>
              {meeting.description && (
                <p className="mt-1 text-md text-fg-2">{meeting.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-fg-meta">
                <span>
                  {meeting.speaker_count} {meeting.speaker_count === 1 ? 'speaker' : 'speakers'}
                </span>
                <span>{Math.round(meeting.duration_seconds / 60)} min</span>
                {meeting.languages && <span>{formatLanguages(meeting.languages)}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </SearchShell>
  )
}

/** Header and chrome, shared by the page and its Suspense fallback. */
function SearchShell({ query, children }: { query: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <div className="border-b border-line px-4 py-8 sm:px-6">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-base text-fg-2 transition-colors hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All meetings
        </Link>
        <h1 className="mb-2 mt-2 text-[32px] font-bold leading-tight text-fg-1">Search Results</h1>
        {query && <p className="text-base text-fg-2">Results for &quot;{query}&quot;</p>}
        <div className="mt-4">
          <SearchPageInput initialQuery={query} />
        </div>
      </div>

      <div className="max-w-4xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  )
}
