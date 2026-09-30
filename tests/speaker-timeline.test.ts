import { describe, it, expect } from 'vitest'
import { buildTurns, speakerOrder } from '../components/meeting-detail/speaker-timeline'
import type { ApiTranscript } from '../lib/types'

function line(seconds: number, speaker: string | null): ApiTranscript {
  return {
    id: `${speaker}-${seconds}`,
    meeting_id: 'm1',
    text: 'text',
    timestamp_seconds: seconds,
    speaker_name: speaker,
    original_language: 'en',
    created_at: '2026-09-28T00:00:00',
  }
}

describe('buildTurns', () => {
  it('runs each turn until the next line starts', () => {
    const turns = buildTurns([line(0, 'A'), line(30, 'B'), line(90, 'A')], 600)
    expect(turns[0]).toMatchObject({ speaker: 'A', start: 0, end: 30 })
    expect(turns[1]).toMatchObject({ speaker: 'B', start: 30, end: 90 })
  })

  it('merges consecutive lines by the same speaker into one turn', () => {
    const turns = buildTurns([line(0, 'A'), line(10, 'A'), line(20, 'A'), line(40, 'B')], 600)
    expect(turns).toHaveLength(2)
    expect(turns[0]).toMatchObject({ speaker: 'A', start: 0, end: 40 })
  })

  it('does not stretch the final turn across a long tail of silence', () => {
    // Transcript stops at 3 minutes; the recording runs 30.
    const turns = buildTurns([line(0, 'A'), line(60, 'B'), line(180, 'A')], 1800)
    const last = turns[turns.length - 1]!

    expect(last.start).toBe(180)
    // The final turn gets a typical line's length, not the remaining 27
    // minutes — the exact figure follows the gaps, so assert the shape.
    const longest = Math.max(...turns.slice(0, -1).map((t) => t.end - t.start))
    expect(last.end - last.start).toBeLessThanOrEqual(longest)
    expect(last.end).toBeLessThan(1800 / 2)
  })

  it('never ends a turn past the meeting duration', () => {
    const turns = buildTurns([line(0, 'A'), line(60, 'B'), line(100, 'A')], 110)
    expect(turns[turns.length - 1]!.end).toBeLessThanOrEqual(110)
  })

  it('sorts unordered input by timestamp', () => {
    const turns = buildTurns([line(90, 'B'), line(0, 'A'), line(45, 'A')], 600)
    expect(turns.map((t) => t.speaker)).toEqual(['A', 'B'])
    expect(turns[0]!.start).toBe(0)
  })

  it('labels a missing speaker name rather than dropping the line', () => {
    const turns = buildTurns([line(0, null), line(30, 'A')], 600)
    expect(turns[0]!.speaker).toBe('Unknown')
  })

  it('handles a single line without dividing by zero', () => {
    const turns = buildTurns([line(0, 'A')], 600)
    expect(turns).toHaveLength(1)
    expect(turns[0]!.end).toBeGreaterThan(turns[0]!.start)
  })

  it('returns nothing for an empty transcript', () => {
    expect(buildTurns([], 600)).toEqual([])
  })
})

describe('speakerOrder', () => {
  it('lists speakers by first appearance, which is how colours are assigned', () => {
    const turns = buildTurns(
      [line(0, 'Priya'), line(10, 'David'), line(20, 'Priya'), line(30, 'Marcus')],
      600
    )
    expect(speakerOrder(turns)).toEqual(['Priya', 'David', 'Marcus'])
  })
})
