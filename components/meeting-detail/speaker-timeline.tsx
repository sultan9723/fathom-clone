'use client'

import { useMemo } from 'react'
import type { ApiTranscript } from '@/lib/types'
import { formatTimecode } from '@/lib/utils'
import { Panel } from '@/components/ui'

/**
 * Who spoke when, derived entirely from transcript timestamps.
 *
 * A line has a start but no end, so a turn runs until the next line begins;
 * the last turn runs to the meeting's duration. Consecutive lines from the
 * same speaker are merged into one turn, which is what makes the shape
 * readable — otherwise every line is its own sliver.
 *
 * DESIGN.md assigns speaker colours in order of first appearance and gives
 * three; a fourth speaker onward reuses them in the same order.
 */

const SPEAKER_STYLES = [
  { bar: 'bg-speaker-1', dot: 'bg-speaker-1', text: 'text-speaker-1' },
  { bar: 'bg-speaker-2', dot: 'bg-speaker-2', text: 'text-speaker-2' },
  { bar: 'bg-speaker-3', dot: 'bg-speaker-3', text: 'text-speaker-3' },
]

export interface Turn {
  speaker: string
  start: number
  end: number
}

/** Merges consecutive lines by the same speaker into turns. */
export function buildTurns(lines: ApiTranscript[], durationSeconds: number): Turn[] {
  if (lines.length === 0) return []

  const ordered = [...lines].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
  const turns: Turn[] = []

  for (let i = 0; i < ordered.length; i += 1) {
    const line = ordered[i]!
    const speaker = line.speaker_name?.trim() || 'Unknown'
    const next = ordered[i + 1]
    // A line has no end of its own; it runs until the next one starts.
    const end = next ? next.timestamp_seconds : Math.max(durationSeconds, line.timestamp_seconds)

    const previous = turns[turns.length - 1]
    if (previous && previous.speaker === speaker) {
      previous.end = end
    } else {
      turns.push({ speaker, start: line.timestamp_seconds, end })
    }
  }

  return turns
}

/** Speakers in order of first appearance, which is how colours are assigned. */
export function speakerOrder(turns: Turn[]): string[] {
  const seen: string[] = []
  for (const turn of turns) if (!seen.includes(turn.speaker)) seen.push(turn.speaker)
  return seen
}

export function SpeakerTimeline({
  transcripts,
  durationSeconds,
}: {
  transcripts: ApiTranscript[]
  durationSeconds: number
}) {
  const turns = useMemo(
    () => buildTurns(transcripts, durationSeconds),
    [transcripts, durationSeconds]
  )
  const speakers = useMemo(() => speakerOrder(turns), [turns])

  if (turns.length === 0) return null

  // The timeline spans the meeting, or the last turn if that runs past it.
  const span = Math.max(durationSeconds, turns[turns.length - 1]!.end, 1)

  return (
    <Panel as="section" aria-labelledby="timeline-heading" className="p-5">
      <h2 id="timeline-heading" className="text-label-sm uppercase text-faint">
        Who spoke when
      </h2>

      <div className="mt-4 space-y-3">
        {speakers.map((speaker) => {
          const style = SPEAKER_STYLES[speakers.indexOf(speaker) % SPEAKER_STYLES.length]!
          const own = turns.filter((turn) => turn.speaker === speaker)
          const spoken = own.reduce((total, turn) => total + (turn.end - turn.start), 0)

          return (
            <div key={speaker} className="grid grid-cols-[7rem_1fr] items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                />
                <span className={`truncate text-small font-medium ${style.text}`}>{speaker}</span>
              </div>

              <div className="relative h-6 rounded-chip bg-surface-2">
                {own.map((turn) => (
                  <span
                    key={`${turn.start}-${turn.end}`}
                    className={`absolute inset-y-1 rounded-[3px] ${style.bar}`}
                    style={{
                      left: `${(turn.start / span) * 100}%`,
                      width: `${Math.max(((turn.end - turn.start) / span) * 100, 0.6)}%`,
                    }}
                    title={`${speaker} · ${formatTimecode(turn.start)}–${formatTimecode(turn.end)}`}
                  />
                ))}
                <span className="sr-only">
                  {speaker} spoke for {formatTimecode(spoken)} across {own.length}{' '}
                  {own.length === 1 ? 'turn' : 'turns'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex justify-between border-t border-border-subtle pt-2 font-mono text-label-sm text-faint">
        <span>0:00</span>
        <span>{formatTimecode(span)}</span>
      </div>
    </Panel>
  )
}
