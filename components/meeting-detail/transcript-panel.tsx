'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, Crosshair } from 'lucide-react'
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
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeId, autoScroll, isPlaying, matchIds])

  return (
    <section
      aria-labelledby="transcript-heading"
      className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white"
    >
      <div className="space-y-3 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="transcript-heading" className="text-sm font-semibold text-slate-900">
            Transcript
          </h2>
          <span className="text-xs text-slate-500">
            {matchIds ? `${visible.length} of ${transcript.length}` : `${transcript.length} lines`}
          </span>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript…"
            aria-label="Search transcript"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear transcript search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {!matchIds && (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            Follow playback
          </label>
        )}
      </div>

      <ol
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        // Fixed height on large screens so the panel scrolls independently of the page.
        style={{ maxHeight: 'min(70vh, 640px)' }}
      >
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-slate-500">
            No lines match “{query}”.
          </li>
        )}

        {visible.map((line) => {
          const speaker = speakers.get(line.speakerId)
          const isActive = line.id === activeId && !matchIds
          return (
            <li key={line.id} ref={isActive ? activeRef : undefined}>
              <button
                type="button"
                onClick={() => seek(line.start)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition',
                  isActive ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: speaker?.color ?? '#475569' }}
                  >
                    {speaker?.name ?? 'Unknown'}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {formatTimecode(line.start)}
                  </span>
                </span>
                <p
                  className={cn(
                    'mt-0.5 text-sm leading-relaxed',
                    isActive ? 'text-slate-900' : 'text-slate-600'
                  )}
                >
                  {normalisedQuery ? highlight(line.text, normalisedQuery) : line.text}
                </p>
              </button>
            </li>
          )
        })}
      </ol>
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
      <mark key={found} className="rounded bg-amber-200/70 text-slate-900">
        {text.slice(found, found + term.length)}
      </mark>
    )
    cursor = found + term.length
    found = lower.indexOf(term, cursor)
  }

  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
