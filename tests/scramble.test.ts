import { describe, it, expect } from 'vitest'
import { __testing } from '../lib/scramble'

const { frame, poolFor } = __testing

describe('scramble frame', () => {
  const urdu = 'یہ اٹلس کا آغاز ہے'

  it('shows the finished text once every character has settled', () => {
    const total = Array.from(urdu).length
    expect(frame(urdu, total, poolFor('ur'), true)).toBe(urdu)
  })

  it('never scrambles whitespace, so word shapes survive the animation', () => {
    const scrambled = frame(urdu, 0, poolFor('ur'), true)
    const spaces = (s: string) => Array.from(s).map((c) => (/\s/.test(c) ? ' ' : 'x')).join('')
    expect(spaces(scrambled)).toBe(spaces(urdu))
  })

  it('keeps the character count identical so the line does not reflow', () => {
    for (const settled of [0, 3, 9]) {
      expect(Array.from(frame(urdu, settled, poolFor('ur'), true)).length).toBe(
        Array.from(urdu).length
      )
    }
  })

  it('draws noise from the target script, not latin', () => {
    const scrambled = frame('中文会议记录', 0, poolFor('zh'), false)
    // Every non-space character should come from the Chinese pool.
    for (const char of Array.from(scrambled)) {
      expect(poolFor('zh')).toContain(char)
    }
  })

  it('resolves left to right for LTR text', () => {
    const text = 'hola mundo'
    const partial = frame(text, 4, poolFor('es'), false)
    expect(partial.slice(0, 4)).toBe('hola')
  })

  it('resolves right to left for RTL text', () => {
    const text = 'abcd efgh'
    const chars = Array.from(text)
    const partial = Array.from(frame(text, 4, poolFor('ur'), true))
    // The last 4 characters are the settled ones.
    expect(partial.slice(-4).join('')).toBe(chars.slice(-4).join(''))
  })

  it('falls back to a latin pool for an unknown language', () => {
    expect(poolFor('klingon')).toBe(poolFor('es'))
  })
})
