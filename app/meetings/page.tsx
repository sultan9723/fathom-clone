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

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Hourglass, Languages, UsersRound } from 'lucide-react'
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

/** Wraps every case-insensitive occurrence of `query` in a <mark>. */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return text

  const parts: ReactNode[] = []
  const haystack = text.toLowerCase()
  const needle = q.toLowerCase()
  let from = 0
  let found = haystack.indexOf(needle, from)

  while (found !== -1) {
    if (found > from) parts.push(text.slice(from, found))
    parts.push(
      <mark key={found} className="rounded bg-yellow-200 px-0.5 text-fg-1">
        {text.slice(found, found + needle.length)}
      </mark>
    )
    from = found + needle.length
    found = haystack.indexOf(needle, from)
  }
  if (from < text.length) parts.push(text.slice(from))
  return parts
}

type SpeakerFilter = 'any' | 'small' | 'medium' | 'large'
type DurationFilter = 'any' | 'short' | 'medium' | 'long'

function matchesSpeakerFilter(count: number, filter: SpeakerFilter): boolean {
  if (filter === 'small') return count >= 1 && count <= 2
  if (filter === 'medium') return count >= 3 && count <= 5
  if (filter === 'large') return count >= 6
  return true
}

function matchesDurationFilter(minutes: number, filter: DurationFilter): boolean {
  if (filter === 'short') return minutes < 30
  if (filter === 'medium') return minutes >= 30 && minutes <= 60
  if (filter === 'long') return minutes > 60
  return true
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<ApiMeeting[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [speakerFilter, setSpeakerFilter] = useState<SpeakerFilter>('any')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('any')
  const [languageFilter, setLanguageFilter] = useState('any')
  // Independent of the current search/filter — used for the "Searching
  // across N meetings..." status line, so it doesn't shrink as results do.
  const [totalMeetings, setTotalMeetings] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getMeetings()
      .then((all) => { if (!cancelled) setTotalMeetings(all.length) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

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

  const languageOptions = useMemo(() => {
    const codes = new Set<string>()
    for (const m of meetings) {
      for (const code of (m.languages ?? '').split(',')) {
        const trimmed = code.trim().toUpperCase()
        if (trimmed) codes.add(trimmed)
      }
    }
    return [...codes].sort()
  }, [meetings])

  // The backend has been seeded more than once, so it returns each meeting
  // twice under distinct ids. Keyed by id the rows look unique, so collapse on
  // title instead and keep the first (newest-first order) of each.
  const uniqueMeetings = useMemo(() => {
    const seen = new Set<string>()
    return meetings.filter((meeting) => {
      const key = meeting.title.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [meetings])

  const filteredMeetings = uniqueMeetings.filter((meeting) => {
    if (!matchesSpeakerFilter(meeting.speaker_count, speakerFilter)) return false
    if (!matchesDurationFilter(Math.round(meeting.duration_seconds / 60), durationFilter)) return false
    if (languageFilter !== 'any') {
      const codes = (meeting.languages ?? '').split(',').map((c) => c.trim().toUpperCase())
      if (!codes.includes(languageFilter)) return false
    }
    return true
  })

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

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-fg-3">
            Speakers
            <select
              value={speakerFilter}
              onChange={(e) => setSpeakerFilter(e.target.value as SpeakerFilter)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-fg-1 focus:border-cyan focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="small">1–2</option>
              <option value="medium">3–5</option>
              <option value="large">6+</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-fg-3">
            Duration
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-fg-1 focus:border-cyan focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="short">Under 30 min</option>
              <option value="medium">30–60 min</option>
              <option value="long">Over 60 min</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-fg-3">
            Language
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-fg-1 focus:border-cyan focus:outline-none"
            >
              <option value="any">Any</option>
              {languageOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isSearching && totalMeetings !== null && (
          <p className="mt-3 text-xs text-fg-3">
            {loading ? `Searching across ${totalMeetings} meetings…` : `${filteredMeetings.length} result${filteredMeetings.length === 1 ? '' : 's'} for "${searchQuery.trim()}"`}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="px-4 py-10 sm:px-6">
        {!hasLoaded && loading && <MeetingListSkeleton />}

        {error && <MeetingLoadError title={error} onRetry={() => { setHasLoaded(false); setLoading(true); setError(null); setAttempt((value) => value + 1) }} />}

        {hasLoaded && !loading && !error && meetings.length === 0 && (
          <MeetingEmptyState kind={isSearching ? 'search' : 'meetings'} />
        )}

        {hasLoaded && !loading && !error && meetings.length > 0 && filteredMeetings.length === 0 && (
          <p className="text-md text-fg-3">No meetings match these filters.</p>
        )}

        {hasLoaded && loading && meetings.length === 0 && <MeetingListSkeleton />}

        {hasLoaded && !error && filteredMeetings.length > 0 && (
          // DESIGN-NOTEAI.md: loading is a dim, not a spinner — the list stays
          // in place while a search refetches instead of flashing empty.
          <div
            aria-busy={loading}
            className={`grid grid-cols-1 gap-5 motion-safe:animate-fadein motion-safe:transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : 'opacity-100'}`}
          >
            {filteredMeetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="group block rounded-lg border-l-[3px] border-l-cyan bg-gradient-to-b from-white to-surface-1 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)]"
              >
                <h3 className="text-xl font-bold text-fg-1 transition-colors group-hover:text-brand">
                  {highlight(meeting.title, searchQuery)}
                </h3>
                {meeting.description && (
                  <p className="mt-1.5 line-clamp-2 text-md text-fg-2">
                    {highlight(meeting.description, searchQuery)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-gradient-to-br from-cyan/10 to-cyan/5 px-3 py-2 text-xs font-semibold text-fg-1 shadow-[0_1px_3px_rgba(0,212,255,0.1)]">
                    <UsersRound className="h-3.5 w-3.5 text-cyan" aria-hidden="true" />
                    {meeting.speaker_count} {meeting.speaker_count === 1 ? 'speaker' : 'speakers'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-gradient-to-br from-cyan/10 to-cyan/5 px-3 py-2 text-xs font-semibold text-fg-1 shadow-[0_1px_3px_rgba(0,212,255,0.1)]">
                    <Hourglass className="h-3.5 w-3.5 text-cyan" aria-hidden="true" />
                    {Math.round(meeting.duration_seconds / 60)} min
                  </span>
                  {meeting.languages && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/50 bg-cyan/15 px-3 py-2 text-xs font-bold text-[#00a3cc] shadow-[0_2px_4px_rgba(0,212,255,0.15)]">
                      <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatLanguages(meeting.languages)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
