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
        setError('Failed to load meetings')
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
  }, [searchQuery])

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-[32px] font-bold leading-tight text-gray-900">Meetings</h1>
        <p className="text-base text-gray-600">Search and view all your meetings</p>
      </div>

      {/* Search */}
      <div className="border-b border-gray-200 px-4 py-6 sm:px-6">
        <input
          type="search"
          aria-label="Search meetings"
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-md text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Results */}
      <div className="px-4 py-8 sm:px-6">
        {!hasLoaded && loading && <p className="text-md text-gray-600">Loading meetings...</p>}

        {error && <p className="text-md text-red-600">{error}</p>}

        {hasLoaded && !error && meetings.length === 0 && (
          <p className="text-md text-gray-500">
            {isSearching ? 'No meetings found' : 'No meetings yet'}
          </p>
        )}

        {hasLoaded && !error && meetings.length > 0 && (
          // DESIGN-NOTEAI.md: loading is a dim, not a spinner — the list stays
          // in place while a search refetches instead of flashing empty.
          <div className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="block rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <h3 className="text-xl font-semibold text-gray-900">{meeting.title}</h3>
                {meeting.description && (
                  <p className="mt-1 text-md text-gray-600">{meeting.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
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
