import { describe, it, expect } from 'vitest'
import {
  duration,
  durationSec,
  easeOut,
  easeOutCss,
  riseIn,
  fadeOut,
  stagger,
  translateTiming,
} from '../lib/motion'

describe('motion tokens', () => {
  it('matches the DESIGN.md duration table', () => {
    expect(duration.fast).toBe(150)
    expect(duration.base).toBeGreaterThanOrEqual(250)
    expect(duration.base).toBeLessThanOrEqual(300)
    expect(duration.slow).toBeGreaterThanOrEqual(450)
    expect(duration.slow).toBeLessThanOrEqual(600)
  })

  it('exposes seconds for the motion package', () => {
    expect(durationSec.fast).toBeCloseTo(0.15)
    expect(durationSec.slow).toBeCloseTo(duration.slow / 1000)
  })

  it('uses the DESIGN.md ease-out curve in both forms', () => {
    expect(easeOut).toEqual([0.2, 0.8, 0.2, 1])
    expect(easeOutCss).toBe('cubic-bezier(0.2, 0.8, 0.2, 1)')
  })

  it('staggers related items by 100-150ms', () => {
    expect(stagger.tight).toBe(100)
    expect(stagger.loose).toBe(150)
  })

  it('uses the specified translate timings', () => {
    expect(translateTiming.lineStagger).toBe(110)
    expect(translateTiming.lineDuration).toBe(650)
  })

  it('rises 8-18px on entrance and animates only opacity and transform', () => {
    expect(riseIn.initial.y).toBeGreaterThanOrEqual(8)
    expect(riseIn.initial.y).toBeLessThanOrEqual(18)
    expect(Object.keys(riseIn.initial).sort()).toEqual(['opacity', 'y'])
    expect(Object.keys(riseIn.animate).sort()).toEqual(['opacity', 'y'])
  })

  it('exits faster than it enters', () => {
    expect(fadeOut.transition.duration).toBeLessThan(riseIn.transition.duration)
  })
})
