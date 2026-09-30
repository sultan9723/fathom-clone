'use client'

/**
 * Meeting list. Everything on this page comes from the API — there is no
 * seed or demo content behind it.
 *
 * Keep the complete loaded list stable. Search and date filters are derived
 * from query state, so network responses cannot resurrect stale results.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { ApiMeeting } from '@/lib/types'
import { getMeetings } from '@/lib/api'
import { filterMeetings } from '@/lib/meeting-filter'
import { Input, SegmentedControl } from '@/components/ui'
import { AddMeetingBar } from '@/components/meetings/add-meeting-bar'
import { MeetingsTable } from '@/components/meetings/meetings-table'
import {
  MeetingsEmpty,
  MeetingsError,
  MeetingsSkeleton,
} from '@/components/meetings/list-states'

type Range = 'all' | 'week'

const RANGE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'week' as const, label: 'This week' },
]

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * The backend serialises created_at without a zone suffix, and `new Date()`
 * reads a bare timestamp as local time — which would shift the week boundary
 * by the viewer's offset. Force UTC when no designator is present.
 */
function parseUtc(iso: string): number {
  return new Date(/[Zz]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`).getTime()
}

function withinWeek(meeting: ApiMeeting): boolean {
  return Date.now() - parseUtc(meeting.created_at) <= WEEK_MS
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<ApiMeeting[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [range, setRange] = useState<Range>('all')
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150)
    return () => clearTimeout(timer)
  }, [query])

  // Native search clear and the explicit clear button both reset immediately.
  const activeQuery = query.trim() ? debouncedQuery : ''
  const clear = () => {
    setQuery('')
    setDebouncedQuery('')
    setRange('all')
  }

  useEffect(() => {
    // `cancelled` guards against out-of-order responses: clearing the timer
    // stops a pending fetch from starting, but not one already in flight, so
    // fast typing could otherwise let an older result overwrite a newer one.
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(false)
        const results = await getMeetings()
        if (!cancelled) setMeetings(results)
      } catch {
        if (!cancelled) {
          setError(true)
          setMeetings([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHasLoaded(true)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [attempt])

  const visible = useMemo(
    () => filterMeetings(range === 'week' ? meetings.filter(withinWeek) : meetings, activeQuery),
    [meetings, range, activeQuery]
  )

  const retry = useCallback(() => {
    setHasLoaded(false)
    setError(false)
    setAttempt((value) => value + 1)
  }, [])

  const showSkeleton = loading && !hasLoaded
  const showEmpty = hasLoaded && !loading && !error && visible.length === 0

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="pb-6">
        <h1 className="text-h1 text-text">Meetings</h1>
      </header>

      <AddMeetingBar />

      <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <label htmlFor="meeting-search" className="sr-only">
            Search meetings
          </label>
          <Input
            id="meeting-search"
            type="search"
            placeholder="Search meetings"
            value={query}
            className="pr-12 [&::-webkit-search-cancel-button]:appearance-none"
            onChange={(event) => event.target.value ? setQuery(event.target.value) : clear()}
          />
          {query && <button type="button" aria-label="Clear search" onClick={clear}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted hover:text-text"><X aria-hidden="true" size={18} /></button>}
        </div>

        <SegmentedControl
          className="self-start"
          label="Filter meetings by date"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
        />
      </div>
      <Link className="mb-4 inline-flex min-h-[44px] items-center text-small text-muted underline" href={`/search?q=${encodeURIComponent(query.trim())}`}>Search transcript text</Link>

      {/* Announced for screen readers; the count on screen is the table itself. */}
      <p aria-live="polite" className="sr-only">
        {loading
          ? 'Loading meetings'
          : `${visible.length} ${visible.length === 1 ? 'meeting' : 'meetings'}`}
      </p>

      {showSkeleton && <MeetingsSkeleton />}
      {error && <MeetingsError onRetry={retry} />}
      {showEmpty && (
        <MeetingsEmpty
          reason={
            query.trim() ? 'search' : range === 'week' && meetings.length > 0 ? 'week' : 'none'
          }
          query={query}
        />
      )}
      {!showSkeleton && !error && visible.length > 0 && (
        <MeetingsTable meetings={visible} query={activeQuery} busy={loading} />
      )}
    </div>
  )
}
