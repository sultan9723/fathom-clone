import { describe, expect, it } from 'vitest'
import { detectPlatform, platforms, storyPosition } from '../components/marketing/demo'

describe('meeting demo platform detection', () => {
  it.each(platforms)('detects $name from its URL', ({ url, name }) => {
    expect(detectPlatform(url)).toBe(name)
  })
  it('detects regional Zoom meeting hosts', () => {
    expect(detectPlatform('https://us02web.zoom.us/j/123')).toBe('Zoom')
  })
  it.each(['https://zoom.us.attacker.com/j/123', 'https://notzoom.us/j/123', 'https://example.com/?next=meet.google.com', 'https://', ''])('rejects incomplete or unrelated host: %s', (url) => {
    expect(detectPlatform(url)).toBeNull()
  })
})

describe('scroll story navigation', () => {
  it('keeps Connect selected before the stage starts', () => {
    expect(storyPosition(900, 5000, 1000)).toEqual({ step: 0, position: 0 })
  })
  it('visits each of the five steps at its scroll position', () => {
    for (let step = 0; step < 5; step++) {
      expect(storyPosition(-(step + 0.15) * 800, 5000, 1000).step).toBe(step)
    }
  })
  it('finishes Ask without selecting a nonexistent sixth step', () => {
    expect(storyPosition(-5000, 5000, 1000)).toEqual({ step: 4, position: 5 })
  })
  it('never returns NaN when a viewport is taller than its stage', () => {
    expect(storyPosition(0, 600, 800)).toEqual({ step: 0, position: 0 })
  })
})
