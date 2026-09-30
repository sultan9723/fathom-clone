import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { JsonMeetingRepository } from '../lib/repository'

const repo = new JsonMeetingRepository()

describe('JsonMeetingRepository', () => {
  it('loads every seed meeting', async () => {
    const ids = await repo.listIds()
    expect(ids.length).toBeGreaterThanOrEqual(5)
  })

  it('returns meetings newest first', async () => {
    const meetings = await repo.list()
    const dates = meetings.map((m) => Date.parse(m.date))
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })

  it('omits the transcript from list items', async () => {
    const [first] = await repo.list()
    expect(first).toBeDefined()
    expect(first).not.toHaveProperty('transcript')
    expect(first!.actionItemCount).toBeGreaterThan(0)
  })

  it('counts only open action items', async () => {
    const meeting = await repo.getById('sprint-24-retro')
    const [listItem] = await repo.list({ search: 'Sprint 24' })
    const open = meeting!.actionItems.filter((a) => !a.done).length
    expect(listItem!.openActionItemCount).toBe(open)
  })

  it('filters by title, case-insensitively', async () => {
    const hits = await repo.list({ search: 'sprint' })
    expect(hits).toHaveLength(1)
    expect(hits[0]!.id).toBe('sprint-24-retro')
  })

  it('ignores surrounding whitespace in a search', async () => {
    const hits = await repo.list({ search: '   sprint  ' })
    expect(hits).toHaveLength(1)
  })

  it('returns everything for an empty search', async () => {
    const all = await repo.list()
    expect(await repo.list({ search: '' })).toHaveLength(all.length)
  })

  it('returns an empty array when nothing matches', async () => {
    expect(await repo.list({ search: 'zzzzz' })).toEqual([])
  })

  it('returns null for an unknown id rather than throwing', async () => {
    expect(await repo.getById('does-not-exist')).toBeNull()
  })

  it('returns transcripts sorted by start time', async () => {
    for (const id of await repo.listIds()) {
      const meeting = await repo.getById(id)
      const starts = meeting!.transcript.map((l) => l.start)
      expect(starts).toEqual([...starts].sort((a, b) => a - b))
    }
  })

  it('keeps every reference inside a meeting resolvable', async () => {
    for (const id of await repo.listIds()) {
      const meeting = await repo.getById(id)
      const ids = new Set(meeting!.participants.map((p) => p.id))

      for (const line of meeting!.transcript) {
        expect(ids.has(line.speakerId)).toBe(true)
        expect(line.end).toBeGreaterThan(line.start)
        expect(line.end).toBeLessThanOrEqual(meeting!.durationSec)
      }
      for (const item of meeting!.actionItems) {
        if (item.assigneeId) expect(ids.has(item.assigneeId)).toBe(true)
        if (item.timestamp !== undefined) {
          expect(item.timestamp).toBeLessThanOrEqual(meeting!.durationSec)
        }
      }
      for (const h of meeting!.highlights) {
        expect(h.end).toBeGreaterThan(h.start)
        expect(h.end).toBeLessThanOrEqual(meeting!.durationSec)
      }
    }
  })

  it('fails loudly when the directory does not exist', async () => {
    const missing = new JsonMeetingRepository(path.join(process.cwd(), 'data', 'nope'))
    await expect(missing.list()).rejects.toThrow(/Could not read meetings directory/)
  })
})
