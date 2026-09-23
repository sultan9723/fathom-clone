import { describe, it, expect } from 'vitest'
import { findActiveLineIndex, tokenize, TranscriptIndex } from '../lib/transcript'
import type { Meeting, Participant, TranscriptLine } from '../lib/types'

const participants: Participant[] = [
  { id: 'p1', name: 'Marcus Webb', color: '#0ea5e9' },
  { id: 'p2', name: 'Sofia Duarte', color: '#a855f7' },
]

const line = (id: string, speakerId: string, start: number, end: number, text: string): TranscriptLine =>
  ({ id, speakerId, start, end, text })

const transcript: TranscriptLine[] = [
  line('t1', 'p1', 0, 10, 'Welcome everyone, let us begin the review.'),
  line('t2', 'p2', 20, 30, 'The export feature.'),
  line('t3', 'p2', 40, 80, 'I estimated it at three points because the provider rate limits at a level that is not documented anywhere.'),
  line('t4', 'p1', 100, 120, 'So we rewrite it as a batched job with retry logic and move on.'),
]

const meeting = { transcript, participants } as Pick<Meeting, 'transcript' | 'participants'>

describe('findActiveLineIndex', () => {
  it('returns -1 before the first line starts', () => {
    expect(findActiveLineIndex(transcript, -5)).toBe(-1)
  })

  it('finds the line active at an exact start boundary', () => {
    expect(findActiveLineIndex(transcript, 20)).toBe(1)
    expect(findActiveLineIndex(transcript, 40)).toBe(2)
  })

  it('finds the line active mid-utterance', () => {
    expect(findActiveLineIndex(transcript, 25)).toBe(1)
    expect(findActiveLineIndex(transcript, 79)).toBe(2)
  })

  it('holds the previous line during a gap between utterances', () => {
    // 15s falls in the silence between t1 (ends 10) and t2 (starts 20).
    expect(findActiveLineIndex(transcript, 15)).toBe(1 - 1)
  })

  it('stays on the last line past the end of the transcript', () => {
    expect(findActiveLineIndex(transcript, 9999)).toBe(3)
  })

  it('handles an empty transcript', () => {
    expect(findActiveLineIndex([], 10)).toBe(-1)
  })

  it('agrees with a linear scan across the whole timeline', () => {
    for (let t = 0; t <= 130; t++) {
      let expected = -1
      for (let i = 0; i < transcript.length; i++) {
        if (transcript[i]!.start <= t) expected = i
      }
      expect(findActiveLineIndex(transcript, t)).toBe(expected)
    }
  })
})

describe('tokenize', () => {
  it('drops stop words and single characters', () => {
    expect(tokenize('the export of a feature')).toEqual(['export', 'feature'])
  })

  it('lowercases and strips punctuation', () => {
    expect(tokenize('Rate-limits, documented!')).toEqual(['rate-limits', 'documented'])
  })
})

describe('TranscriptIndex', () => {
  const index = new TranscriptIndex(meeting)

  it('returns nothing for a query with no usable terms', () => {
    expect(index.search('the and of')).toEqual([])
  })

  it('returns nothing when no line matches', () => {
    expect(index.search('kubernetes')).toEqual([])
  })

  it('matches on speaker name as well as content', () => {
    const hits = index.search('Sofia')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((h) => h.speaker?.name === 'Sofia Duarte')).toBe(true)
  })

  it('ranks a substantive line above a short fragment sharing the same terms', () => {
    // Both t2 and t3 are Sofia; only BM25 length normalisation keeps the
    // three-word "The export feature." from dominating.
    const hits = index.search('rate limits documented')
    expect(hits[0]!.line.id).toBe('t3')
  })

  it('builds context in chronological order with neighbours', () => {
    const context = index.buildContext('export feature', { limit: 1, neighbours: 1 })
    const ids = context.split('\n')
    expect(ids).toHaveLength(3) // t1, t2, t3
    expect(ids[0]).toContain('Welcome everyone')
    expect(ids[1]).toContain('The export feature.')
    expect(ids[2]).toContain('I estimated it')
  })

  it('formats context with timestamps and speaker names', () => {
    const context = index.buildContext('export', { limit: 1, neighbours: 0 })
    expect(context).toBe('[0:20] Sofia Duarte: The export feature.')
  })

  it('returns an empty context when nothing matches', () => {
    expect(index.buildContext('kubernetes')).toBe('')
  })

  it('lineAfter walks forward and stops at the end', () => {
    expect(index.lineAfter(transcript[1]!)?.id).toBe('t3')
    expect(index.lineAfter(transcript[3]!)).toBeUndefined()
  })

  it('fullText includes every line', () => {
    expect(index.fullText().split('\n')).toHaveLength(transcript.length)
  })
})
