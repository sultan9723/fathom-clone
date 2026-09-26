'use client'

/**
 * Word-by-word transcript reveal for a meeting still "in progress" (created
 * within the last 2 hours — see isMeetingInProgress in app/meetings/[id]/page.tsx).
 * There is no live transcription backend; this simulates one arriving by
 * revealing each line's words on a 50ms timer, then hands off to the caller
 * once every line has fully appeared so the normal, fully-interactive
 * NoteAiTranscript (search, translate, scroll-seek) takes over.
 */

import { useEffect, useState } from 'react'
import type { ApiTranscript } from '@/lib/types'
import { formatTimecode, initials, languageName } from '@/lib/utils'

const MS_PER_WORD = 50

export function NoteAiLiveTranscript({
  transcripts,
  onDone,
}: {
  transcripts: ApiTranscript[]
  onDone: () => void
}) {
  const [lineIndex, setLineIndex] = useState(0)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    if (lineIndex >= transcripts.length) {
      onDone()
      return
    }
    const words = transcripts[lineIndex]!.text.split(/\s+/).filter(Boolean)
    if (wordIndex >= words.length) {
      const timer = window.setTimeout(() => {
        setLineIndex((i) => i + 1)
        setWordIndex(0)
      }, MS_PER_WORD)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setWordIndex((w) => w + 1), MS_PER_WORD)
    return () => window.clearTimeout(timer)
    // transcripts is stable for the lifetime of this component (it unmounts
    // once onDone fires), so it's intentionally left out of the deps list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex, wordIndex, onDone])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
        </span>
        Live transcript
      </div>

      <ul className="flex flex-col gap-2">
        {transcripts.slice(0, lineIndex + 1).map((line, i) => {
          const speaker = line.speaker_name?.trim() || 'Unknown speaker'
          const words = line.text.split(/\s+/).filter(Boolean)
          const shownWords = i < lineIndex ? words : words.slice(0, wordIndex)
          const finished = i < lineIndex

          return (
            <li key={line.id} className="rounded-md bg-white p-3">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-4 text-xs font-semibold text-fg-1"
              >
                {initials(speaker)}
              </span>
              <div className="mt-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-md font-semibold text-fg-1">{speaker}</span>
                  <span className="font-mono text-xs tabular-nums text-fg-3">
                    {formatTimecode(line.timestamp_seconds)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-cyan">
                  {speaker} detected
                  {line.original_language && ` (${languageName(line.original_language)})`}
                </p>
                <p className="mt-1 text-md leading-5 text-fg-1">
                  {shownWords.join(' ')}
                  {!finished && <span className="ml-0.5 animate-pulse text-cyan">▌</span>}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
