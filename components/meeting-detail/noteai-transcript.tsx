'use client'

/**
 * NoteAI transcript list. Reads from the FastAPI backend (ApiTranscript),
 * unlike the Round-1 transcript-panel.tsx which renders seed-file lines.
 *
 * Time state lives in PlayerProvider, per CLAUDE.md — clicking a line and
 * scrolling the list both drive the same `currentTime` the header displays.
 * There is no <video> mounted on this page; PlayerProvider handles that (a
 * seek with no media element just moves its own clock).
 */

import { useEffect, useRef, type ReactNode } from 'react'
import type { ApiTranscript } from '@/lib/types'
import { cn, formatTimecode, initials, languageName } from '@/lib/utils'
import { usePlayer } from './player-provider'
import { NoteAiTranslator } from './noteai-translator'

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
      <mark key={`${found}`} className="rounded bg-yellow-200 px-0.5 text-fg-1">
        {text.slice(found, found + needle.length)}
      </mark>
    )
    from = found + needle.length
    found = haystack.indexOf(needle, from)
  }
  if (from < text.length) parts.push(text.slice(from))
  return parts
}

export function NoteAiTranscript({
  transcripts,
  query,
  sourceLang = 'EN',
}: {
  transcripts: ApiTranscript[]
  query: string
  /** Single language code for the translator; the meeting stores a list. */
  sourceLang?: string
}) {
  const { currentTime, seek } = usePlayer()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef(new Map<string, HTMLLIElement>())
  // Set while a scroll-driven update is in flight, so syncing the clock to the
  // scroll position doesn't fight a click that just set it.
  const suppressScrollSync = useRef(false)

  // Requirement: scrolling the transcript moves the timestamp display. The
  // topmost line still inside the viewport wins.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let frame = 0
    const onScroll = () => {
      if (suppressScrollSync.current) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top
        let best: ApiTranscript | null = null
        for (const line of transcripts) {
          const node = lineRefs.current.get(line.id)
          if (!node) continue
          // 8px of slack so a line peeking in at the top still counts.
          if (node.getBoundingClientRect().top - top <= 8) best = line
          else break
        }
        if (best) seek(best.timestamp_seconds)
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', onScroll)
    }
  }, [transcripts, seek])

  if (transcripts.length === 0) {
    return (
      <>
        <p className="py-8 text-md text-fg-3">No transcript recorded for this meeting yet.</p>
        <NoteAiTranslator transcriptText="" sourceLang={sourceLang} />
      </>
    )
  }

  // The active line is the last one at or before the current position.
  const activeId = transcripts.reduce<string | null>(
    (acc, line) => (line.timestamp_seconds <= currentTime ? line.id : acc),
    transcripts[0]?.id ?? null
  )

  return (
    <>
      {/* The list scrolls; the translator below it must not, or it disappears
          inside the transcript's own scrollbar. */}
      <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto pr-1">
        <ul className="flex flex-col gap-2">
          {transcripts.map((line) => {
            const speaker = line.speaker_name?.trim() || 'Unknown speaker'
            const isActive = line.id === activeId
            return (
              <li
                key={line.id}
                ref={(node) => {
                  if (node) lineRefs.current.set(line.id, node)
                  else lineRefs.current.delete(line.id)
                }}
              >
                <button
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => {
                    suppressScrollSync.current = true
                    seek(line.timestamp_seconds)
                    window.setTimeout(() => {
                      suppressScrollSync.current = false
                    }, 300)
                  }}
                  className={cn(
                    'flex w-full gap-3 rounded-md p-3 text-left transition-colors',
                    isActive ? 'bg-brand/10' : 'bg-white hover:bg-surface-2'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-4 text-xs font-semibold text-fg-1"
                  >
                    {initials(speaker)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-md font-semibold text-fg-1">{speaker}</span>
                      <span className="font-mono text-xs tabular-nums text-fg-3">
                        {formatTimecode(line.timestamp_seconds)}
                      </span>
                    </span>
                    {line.original_language && (
                      <span className="mt-0.5 block text-xs text-fg-3">
                        {languageName(line.original_language)}
                      </span>
                    )}
                    <span className="mt-1 block text-md leading-5 text-fg-1">
                      {highlight(line.text, query)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <NoteAiTranslator
        transcriptText={transcripts.map((line) => line.text).join(' ')}
        sourceLang={sourceLang}
      />
    </>
  )
}
