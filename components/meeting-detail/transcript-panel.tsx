'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, ArrowDown } from 'lucide-react'
import type { Participant, TranscriptLine } from '@/lib/types'
import { findActiveLineIndex } from '@/lib/transcript'
import { cn, formatTimecode } from '@/lib/utils'
import { usePlayer } from './player-provider'

export function TranscriptPanel({
  transcript,
  participants,
}: {
  transcript: TranscriptLine[]
  participants: Participant[]
}) {
  const { currentTime, seek, isPlaying } = usePlayer()
  const [query, setQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const listRef = useRef<HTMLOListElement | null>(null)
  const activeRef = useRef<HTMLLIElement | null>(null)
  // Distinguishes our own scrollIntoView calls from the user scrolling by
  // hand, so a programmatic follow-scroll doesn't itself flip autoScroll off.
  const programmaticScroll = useRef(false)

  const speakers = useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants]
  )

  // O(log n) — runs on every throttled time update.
  const activeIndex = findActiveLineIndex(transcript, currentTime)
  const activeId = activeIndex >= 0 ? transcript[activeIndex]!.id : null

  const normalisedQuery = query.trim().toLowerCase()
  const matchIds = useMemo(() => {
    if (!normalisedQuery) return null
    return new Set(
      transcript
        .filter(
          (l) =>
            l.text.toLowerCase().includes(normalisedQuery) ||
            (speakers.get(l.speakerId)?.name ?? '').toLowerCase().includes(normalisedQuery)
        )
        .map((l) => l.id)
    )
  }, [normalisedQuery, transcript, speakers])

  const visible = matchIds ? transcript.filter((l) => matchIds.has(l.id)) : transcript

  // Follow the active line while playing, unless the user has scrolled away.
  useEffect(() => {
    if (!autoScroll || !isPlaying || matchIds) return
    programmaticScroll.current = true
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const timer = setTimeout(() => {
      programmaticScroll.current = false
    }, 500)
    return () => clearTimeout(timer)
  }, [activeId, autoScroll, isPlaying, matchIds])

  const handleUserScroll = useCallback(() => {
    if (programmaticScroll.current) return
    setAutoScroll(false)
  }, [])

  const resume = useCallback(() => {
    programmaticScroll.current = true
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setAutoScroll(true)
    setTimeout(() => {
      programmaticScroll.current = false
    }, 500)
  }, [])

  const showResumePill = !matchIds && !autoScroll && activeId !== null

  return (
    <section aria-labelledby="transcript-heading" className="relative flex min-h-0 flex-col bg-black px-4">
      <h2 id="transcript-heading" className="sr-only">
        Transcript
      </h2>

      <div className="py-3">
        <div className="relative h-transcript-search w-transcript-search max-w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-line-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript"
            aria-label="Search transcript"
            className="h-full w-full rounded-full border-[0.67px] border-line-faint bg-surface-2 pl-8 pr-8 text-xs text-fg-1 placeholder:text-line-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear transcript search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-line-faint transition hover:text-fg-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ol
        ref={listRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4"
        style={{ maxHeight: 'min(70vh, 640px)' }}
      >
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-fg-3">No lines match &quot;{query}&quot;.</li>
        )}

        {visible.map((line) => {
          const speaker = speakers.get(line.speakerId)
          const isActive = line.id === activeId && !matchIds
          return (
            <li key={line.id} ref={isActive ? activeRef : undefined} className="flex items-start gap-3">
              <span className="w-16 shrink-0 pt-1.5 text-right text-[13px] font-bold not-italic text-line sm:w-20">
                {speaker?.name ?? 'Unknown'}
              </span>
              <button
                type="button"
                onClick={() => seek(line.start)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'w-4/5 rounded-md rounded-tr-none px-2.5 py-[5px] text-left transition-colors md:w-3/5',
                  isActive ? 'bg-brand/15' : 'bg-[rgba(74,75,75,0.5)] hover:bg-[rgba(74,75,75,0.8)]'
                )}
              >
                <p className="text-[13px] font-medium leading-4 text-fg-1">
                  {normalisedQuery ? highlight(line.text, normalisedQuery) : line.text}
                </p>
                <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-fg-3">
                  {formatTimecode(line.start)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {showResumePill && (
        <button
          type="button"
          onClick={resume}
          className="absolute bottom-0 left-1/2 flex h-resume-pill w-resume-pill -translate-x-1/2 items-center justify-center gap-1.5 rounded-t-lg bg-brand text-[13px] font-medium text-surface-2 shadow-lg"
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          Resume auto-scroll
        </button>
      )}
    </section>
  )
}

/** Wraps case-insensitive matches of `term` in <mark> without using dangerouslySetInnerHTML. */
function highlight(text: string, term: string) {
  const lower = text.toLowerCase()
  const parts: React.ReactNode[] = []
  let cursor = 0
  let found = lower.indexOf(term)

  while (found !== -1) {
    if (found > cursor) parts.push(text.slice(cursor, found))
    parts.push(
      <mark key={found} className="rounded bg-warning/70 text-surface-2">
        {text.slice(found, found + term.length)}
      </mark>
    )
    cursor = found + term.length
    found = lower.indexOf(term, cursor)
  }

  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
