import { describe, it, expect } from 'vitest'
import { searchAcrossMeetings, formatTimestamp } from '../lib/search'
import { JsonMeetingRepository } from '../lib/repository'
import type { Meeting, Participant, TranscriptLine } from '../lib/types'

const participants: Participant[] = [
  { id: 'p1', name: 'Marcus Webb', color: '#0ea5e9' },
  { id: 'p2', name: 'Sofia Duarte', color: '#a855f7' },
]

const line = (id: string, speakerId: string, text: string): TranscriptLine => ({
  id,
  speakerId,
  start: 10,
  end: 20,
  text,
})

const meetingA: Meeting = {
  id: 'meeting-a',
  title: 'Meeting A',
  date: '2026-01-01T00:00:00.000Z',
  durationSec: 600,
  videoUrl: 'https://example.com/a.mp4',
  platform: 'zoom',
  participants,
  transcript: [
    line('a1', 'p1', 'We need to finalize the Q3 budget before Friday.'),
    line('a2', 'p2', 'Nothing relevant here.'),
  ],
  summary: { overview: '', keyPoints: [] },
  actionItems: [],
  highlights: [],
}

const meetingB: Meeting = {
  id: 'meeting-b',
  title: 'Meeting B',
  date: '2026-01-02T00:00:00.000Z',
  durationSec: 600,
  videoUrl: 'https://example.com/b.mp4',
  platform: 'meet',
  participants,
  transcript: [line('b1', 'p1', 'The budget review is scheduled for next week.')],
  summary: { overview: '', keyPoints: [] },
  actionItems: [],
  highlights: [],
}

const meetings = [meetingA, meetingB]

describe('searchAcrossMeetings', () => {
  it('returns nothing for an empty or whitespace-only query', () => {
    expect(searchAcrossMeetings('', meetings)).toEqual([])
    expect(searchAcrossMeetings('   ', meetings)).toEqual([])
  })

  it('returns nothing when no line matches', () => {
    expect(searchAcrossMeetings('kubernetes', meetings)).toEqual([])
  })

  it('matches across multiple meetings, not just the first', () => {
    const results = searchAcrossMeetings('budget', meetings)
    expect(results.map((r) => r.meetingId).sort()).toEqual(['meeting-a', 'meeting-b'])
  })

  it('is case-insensitive', () => {
    expect(searchAcrossMeetings('BUDGET', meetings)).toHaveLength(2)
  })

  it('resolves the speaker name from the meeting\'s participants', () => {
    const [hit] = searchAcrossMeetings('finalize', meetings)
    expect(hit!.speakerName).toBe('Marcus Webb')
    expect(hit!.speakerId).toBe('p1')
  })

  it('falls back to "Unknown" for a speakerId with no matching participant', () => {
    const orphan: Meeting = {
      ...meetingA,
      id: 'meeting-orphan',
      transcript: [line('o1', 'ghost', 'orphaned budget line')],
    }
    const [hit] = searchAcrossMeetings('orphaned', [orphan])
    expect(hit!.speakerName).toBe('Unknown')
  })

  it('carries the full line data through, not just the snippet', () => {
    const [hit] = searchAcrossMeetings('finalize', meetings)
    expect(hit!.line).toEqual({
      id: 'a1',
      text: 'We need to finalize the Q3 budget before Friday.',
      start: 10,
      end: 20,
    })
  })

  it('wraps the match in <mark> tags without an ellipsis when the match is at the start', () => {
    const [hit] = searchAcrossMeetings('We need', meetings)
    expect(hit!.snippet.startsWith('<mark>We need</mark>')).toBe(true)
    expect(hit!.snippet.startsWith('…')).toBe(false)
  })

  it('adds a leading ellipsis when the match is not near the start of the line', () => {
    const longLine: Meeting = {
      ...meetingA,
      id: 'meeting-long',
      transcript: [
        line(
          'l1',
          'p1',
          'This is a long line with plenty of leading context before the word target appears here.'
        ),
      ],
    }
    const [hit] = searchAcrossMeetings('target', [longLine])
    expect(hit!.snippet.startsWith('…')).toBe(true)
    expect(hit!.snippet).toContain('<mark>target</mark>')
  })

  it('adds a trailing ellipsis when text continues past the snippet window', () => {
    const longLine: Meeting = {
      ...meetingA,
      id: 'meeting-long2',
      transcript: [
        line(
          'l2',
          'p1',
          'target ' + 'word '.repeat(30) + 'end of a very long transcript line here.'
        ),
      ],
    }
    const [hit] = searchAcrossMeetings('target', [longLine])
    expect(hit!.snippet.endsWith('…')).toBe(true)
  })

  it('produces one result per matching line, even multiple lines in one meeting', () => {
    const multi: Meeting = {
      ...meetingA,
      transcript: [
        line('m1', 'p1', 'budget one'),
        line('m2', 'p2', 'budget two'),
      ],
    }
    expect(searchAcrossMeetings('budget', [multi])).toHaveLength(2)
  })
})

describe('formatTimestamp', () => {
  it('formats seconds as m:ss with a zero-padded seconds part', () => {
    expect(formatTimestamp(0)).toBe('0:00')
    expect(formatTimestamp(5)).toBe('0:05')
    expect(formatTimestamp(65)).toBe('1:05')
    expect(formatTimestamp(3661)).toBe('61:01')
  })
})

describe('searchAcrossMeetings against real seed data', () => {
  it('finds real cross-meeting matches through the actual repository', async () => {
    const repo = new JsonMeetingRepository()
    const all = await repo.getAll()
    // "reporting" shows up in at least the Q3 roadmap review transcript.
    const results = searchAcrossMeetings('reporting', all)
    expect(results.length).toBeGreaterThan(0)
    for (const r of results) {
      expect(r.snippet).toContain('<mark>')
      expect(r.line.start).toBeLessThanOrEqual(r.line.end)
    }
  })
})
