import { afterEach, describe, expect, it, vi } from 'vitest'
import { askAI, getMeetings, searchMeetings } from '../lib/api'

afterEach(() => vi.unstubAllGlobals())

describe('recoverable API failures', () => {
  it('distinguishes a failed search from an empty result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })))
    await expect(searchMeetings('planning')).rejects.toThrow('Failed to search meetings')
  })

  it('preserves a genuinely empty search response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([])))
    await expect(searchMeetings('planning')).resolves.toEqual([])
  })

  it('does not request an empty search', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(searchMeetings('  ')).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('can succeed on retry after a transport failure', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(Response.json([])))
    await expect(getMeetings()).rejects.toThrow()
    await expect(getMeetings()).resolves.toEqual([])
  })

  it.each(['API key not configured', 'AI unavailable: AuthenticationError secret-provider-diagnostic'])(
    'treats a provider notice as a safe error: %s', async (response) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ response })))
      await expect(askAI('meeting-1', 'Summarise')).rejects.toThrow(
        'The assistant is temporarily unavailable. Please try again.',
      )
    },
  )

  it('passes a successful AI response through unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ response: 'The team agreed to ship Friday.' })))
    await expect(askAI('meeting-1', 'What was decided?')).resolves.toBe('The team agreed to ship Friday.')
  })
})
