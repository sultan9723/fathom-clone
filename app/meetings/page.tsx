'use client'

/**
 * Meeting list with live search against the NoteAI backend.
 *
 * Font sizes use this repo's token scale (lib/design-tokens.ts replaces
 * Tailwind's default scale): text-xl = 18px, text-md = 14px, text-base = 13px,
 * text-xs = 11px. That's why the classes here don't read like stock Tailwind —
 * they're chosen to land on the px values in DESIGN-NOTEAI.md. H1 is 32px,
 * which has no token, so it's an arbitrary value.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ApiMeeting } from '@/lib/types'
import { getMeetings, searchMeetings } from '@/lib/api'
import { MeetingEmptyState, MeetingListSkeleton, MeetingLoadError } from '@/components/meeting-list/premium-feedback'

/** "en,es,fr" → "EN · ES · FR" */
function formatLanguages(languages: string | null): string {
  if (!languages) return ''
  return languages
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
    .join(' · ')
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<ApiMeeting[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // `cancelled` guards against out-of-order responses: clearing the timer
    // stops a pending fetch from starting, but not one already in flight, so
    // fast typing could otherwise let an older result overwrite a newer one.
    let cancelled = false

    const loadMeetings = async () => {
      try {
        setLoading(true)
        setError(null)
        const results = searchQuery.trim()
          ? await searchMeetings(searchQuery)
          : await getMeetings()
        if (cancelled) return
        setMeetings(results)
      } catch {
        if (cancelled) return
        setError('We couldn’t load your meetings')
        setMeetings([])
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHasLoaded(true)
        }
      }
    }

    const debounceTimer = setTimeout(loadMeetings, 300)
    return () => {
      cancelled = true
      clearTimeout(debounceTimer)
    }
  }, [searchQuery, attempt])

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="border-b border-line px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-[32px] font-bold leading-tight tracking-tight text-fg-1">
          Meetings
        </h1>
        <p className="text-base text-fg-3">Search and view all your meetings</p>
      </div>

      {/* Search */}
      <div className="border-b border-line px-4 py-6 sm:px-6">
        <input
          type="search"
          aria-label="Search meetings"
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface-1 px-4 py-3 text-lg text-fg-1 placeholder-fg-3 shadow-sm transition-all duration-200 focus:border-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] focus:outline-none"
        />
      </div>

      {/* Results */}
      <div className="px-4 py-10 sm:px-6">
        {!hasLoaded && loading && <MeetingListSkeleton />}

        {error && <MeetingLoadError title={error} onRetry={() => { setHasLoaded(false); setLoading(true); setError(null); setAttempt((value) => value + 1) }} />}

        {hasLoaded && !loading && !error && meetings.length === 0 && (
          <MeetingEmptyState kind={isSearching ? 'search' : 'meetings'} />
        )}

        {hasLoaded && loading && meetings.length === 0 && <MeetingListSkeleton />}

        {hasLoaded && !error && meetings.length > 0 && (
          // DESIGN-NOTEAI.md: loading is a dim, not a spinner — the list stays
          // in place while a search refetches instead of flashing empty.
          <div
            aria-busy={loading}
            className={`grid grid-cols-1 gap-5 motion-safe:animate-fadein motion-safe:transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : 'opacity-100'}`}
          >
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="group block rounded-lg border border-line bg-gradient-to-b from-white to-surface-1 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-cyan/40 hover:shadow-[0_8px_24px_rgba(0,212,255,0.15)]"
              >
                <h3 className="text-xl font-bold text-fg-1 transition-colors group-hover:text-brand">
                  {meeting.title}
                </h3>
                {meeting.description && (
                  <p className="mt-1.5 line-clamp-2 text-md text-fg-2">{meeting.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-fg-meta">
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
      </div>
    </div>
  )
}
