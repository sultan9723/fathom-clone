'use client'

import { useMemo } from 'react'
import type { ApiTranscript } from '@/lib/types'
import { formatTimecode } from '@/lib/utils'
import { Panel } from '@/components/ui'

/**
 * Estimated participation, derived entirely from transcript timestamps.
 *
 * A line has a start but no end, so a turn runs until the next line begins;
 * the final line gets a typical turn's duration. Consecutive lines from the
 * same speaker are merged, then totaled into one proportional bar per speaker.
 *
 * Colors follow first appearance, with six distinct colors for demo speakers.
 */

const SPEAKER_STYLES = [
  { bar: 'bg-speaker-1', dot: 'bg-speaker-1', text: 'text-speaker-1' },
  { bar: 'bg-speaker-2', dot: 'bg-speaker-2', text: 'text-speaker-2' },
  { bar: 'bg-speaker-3', dot: 'bg-speaker-3', text: 'text-speaker-3' },
  { bar: 'bg-speaker-4', dot: 'bg-speaker-4', text: 'text-speaker-4' },
  { bar: 'bg-speaker-5', dot: 'bg-speaker-5', text: 'text-speaker-5' },
  { bar: 'bg-speaker-6', dot: 'bg-speaker-6', text: 'text-speaker-6' },
]

export interface Turn {
  speaker: string
  start: number
  end: number
}

/** The typical gap between lines — used to give the final line a length. */
function typicalGap(ordered: ApiTranscript[]): number {
  if (ordered.length < 2) return 30
  const gaps = ordered
    .slice(1)
    .map((line, i) => line.timestamp_seconds - ordered[i]!.timestamp_seconds)
    .filter((gap) => gap > 0)
    .sort((a, b) => a - b)
  return gaps.length ? gaps[Math.floor(gaps.length / 2)]! : 30
}

/**
 * Merges consecutive lines by the same speaker into turns.
 *
 * The last line gets the median gap as its length rather than running to the
 * meeting's duration. Transcripts routinely stop well before the recording
 * does, and stretching the final turn across that silence would draw the last
 * speaker as though they held the floor for the rest of the meeting.
 */
export function buildTurns(lines: ApiTranscript[], durationSeconds: number): Turn[] {
  if (lines.length === 0) return []

  const ordered = [...lines].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
  const tail = typicalGap(ordered)
  const turns: Turn[] = []

  for (let i = 0; i < ordered.length; i += 1) {
    const line = ordered[i]!
    const speaker = line.speaker_name?.trim() || 'Unknown'
    const next = ordered[i + 1]
    // A line has no end of its own; it runs until the next one starts.
    const end = next
      ? next.timestamp_seconds
      : Math.min(line.timestamp_seconds + tail, Math.max(durationSeconds, line.timestamp_seconds))

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

  const totalSpoken = Math.max(turns.reduce((total, turn) => total + turn.end - turn.start, 0), 1)

  return (
    <Panel as="section" aria-labelledby="timeline-heading" className="p-5">
      <h2 id="timeline-heading" className="text-caption uppercase text-faint">
        Speaker participation
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
                  <span
                    data-speaker-bar={speaker}
                    className={`absolute inset-y-1 rounded-[3px] ${style.bar}`}
                    style={{
                      left: 0,
                      width: `${(spoken / totalSpoken) * 100}%`,
                    }}
                    title={`${speaker} · ${Math.round(spoken / totalSpoken * 100)}% · ${formatTimecode(spoken)}`}
                  />
                <span className="sr-only">
                  {speaker} spoke for {formatTimecode(spoken)} across {own.length}{' '}
                  {own.length === 1 ? 'turn' : 'turns'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-small text-faint">Estimated share of speaking time, based on transcript timestamps.</p>
    </Panel>
  )
}
