import { describe, it, expect } from 'vitest'
import { MockProvider } from '../lib/ai/provider'
import { JsonMeetingRepository } from '../lib/repository'
import type { Meeting } from '../lib/types'

const repo = new JsonMeetingRepository()
const provider = new MockProvider()

async function meeting(id = 'sprint-24-retro'): Promise<Meeting> {
  const m = await repo.getById(id)
  if (!m) throw new Error(`missing fixture meeting ${id}`)
  return m
}

describe('MockProvider', () => {
  it('reports itself as the mock provider', async () => {
    const res = await provider.ask({ question: 'export', meeting: await meeting() })
    expect(res.provider).toBe('mock')
  })

  it('follows a short hit forward to the substantive reply', async () => {
    const res = await provider.ask({
      question: 'Why did the export feature slip?',
      meeting: await meeting(),
    })
    // The answer lives in Sofia's long explanation, which contains neither
    // "export" nor "feature" — only the forward walk reaches it.
    expect(res.answer).toContain('rate-limits')
    expect(res.citations.length).toBeGreaterThan(1)
  })

  it('never repeats the same line twice', async () => {
    const res = await provider.ask({
      question: 'Why did the export feature slip?',
      meeting: await meeting(),
    })
    const quoted = res.answer.match(/at \[\d+:\d\d\]/g) ?? []
    expect(new Set(quoted).size).toBe(quoted.length)
  })

  it('falls back to the precomputed summary when nothing matches', async () => {
    const m = await meeting()
    const res = await provider.ask({ question: 'What was decided?', meeting: m })
    expect(res.answer).toContain(m.summary.overview)
    expect(res.answer).toContain('Decisions:')
  })

  it('returns citations that are real, in-range transcript timestamps', async () => {
    const m = await meeting()
    const starts = new Set(m.transcript.map((l) => l.start))
    const res = await provider.ask({ question: 'on-call rotation', meeting: m })
    expect(res.citations.length).toBeGreaterThan(0)
    for (const c of res.citations) {
      expect(starts.has(c)).toBe(true)
      expect(c).toBeLessThanOrEqual(m.durationSec)
    }
  })

  it('returns citations in ascending order', async () => {
    const res = await provider.ask({
      question: 'review latency pairing',
      meeting: await meeting(),
    })
    expect(res.citations).toEqual([...res.citations].sort((a, b) => a - b))
  })

  it('answers for every seed meeting without throwing', async () => {
    for (const id of await repo.listIds()) {
      const res = await provider.ask({ question: 'what happened?', meeting: await meeting(id) })
      expect(res.answer.length).toBeGreaterThan(0)
    }
  })
})
