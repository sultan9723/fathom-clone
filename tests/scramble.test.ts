import { describe, it, expect } from 'vitest'
import { __testing } from '../lib/scramble'

const { frame, poolFor } = __testing

describe('scramble frame', () => {
  const urdu = 'یہ اٹلس کا آغاز ہے'

  it('shows the finished text once every character has settled', () => {
    const total = Array.from(urdu).length
    expect(frame(urdu, total, poolFor('ur'))).toBe(urdu)
  })

  it('never scrambles whitespace, so word shapes survive the animation', () => {
    const scrambled = frame(urdu, 0, poolFor('ur'))
    const spaces = (s: string) => Array.from(s).map((c) => (/\s/.test(c) ? ' ' : 'x')).join('')
    expect(spaces(scrambled)).toBe(spaces(urdu))
  })

  it('keeps the character count identical so the line does not reflow', () => {
    for (const settled of [0, 3, 9]) {
      expect(Array.from(frame(urdu, settled, poolFor('ur'))).length).toBe(
        Array.from(urdu).length
      )
    }
  })

  it('draws noise from the target script, not latin', () => {
    const scrambled = frame('中文会议记录', 0, poolFor('zh'))
    // Every non-space character should come from the Chinese pool.
    for (const char of Array.from(scrambled)) {
      expect(poolFor('zh')).toContain(char)
    }
  })

  it('resolves in reading order, settling the start of the string first', () => {
    const text = 'hola mundo'
    expect(frame(text, 4, poolFor('es')).slice(0, 4)).toBe('hola')
  })

  it('resolves RTL text from its start too, which renders rightmost', () => {
    // Index 0 is where reading begins in every script, so the settled prefix
    // always reads correctly — inverting for RTL would resolve Urdu from the
    // end of the sentence backwards.
    const text = 'یہ اٹلس'
    const chars = Array.from(text)
    const partial = Array.from(frame(text, 2, poolFor('ur')))
    expect(partial.slice(0, 2).join('')).toBe(chars.slice(0, 2).join(''))
  })

  it('falls back to a latin pool for an unknown language', () => {
    expect(poolFor('klingon')).toBe(poolFor('es'))
  })
})
