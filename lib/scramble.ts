'use client'

/**
 * The "translate" signature moment from DESIGN.md: text scrambles in the
 * target script and resolves line by line, 110ms stagger, ~650ms per line.
 *
 * The scramble is drawn from the *target* script, not random Latin noise —
 * the point of the moment is to show the text arriving in the new writing
 * system, so Urdu resolves out of Urdu-looking characters and Chinese out of
 * Chinese ones. Resolving left to right (or right to left for RTL) means the
 * characters that have settled read correctly the whole way through.
 *
 * Under prefers-reduced-motion the hook never animates: it returns the final
 * text immediately, which is DESIGN.md's rule for every signature moment.
 */

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion, translateTiming } from './motion'
import { isRtl, type LanguageCode } from './i18n-text'

/** Characters each script scrambles through. */
const SCRIPT_POOLS: Record<string, string> = {
  ur: 'ابپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمنوہھیے',
  ar: 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
  zh: '的一是不了人我在有他这为之大来以个中上们时说就那和要会也得子你都家可下而过天去能对小多然于心学么之点国',
  ja: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん',
  default: 'abcdefghijklmnopqrstuvwxyzáéíóúàèìòùâêîôûäëïöüñç',
}

function poolFor(lang: string): string {
  return SCRIPT_POOLS[lang] ?? SCRIPT_POOLS.default!
}

function randomFrom(pool: string): string {
  return pool.charAt(Math.floor(Math.random() * pool.length))
}

/**
 * Builds one frame: `settled` characters of `target` are final, the rest are
 * noise from the target script. Whitespace is never scrambled, so the line
 * keeps its word shape while it resolves instead of becoming a solid block.
 */
function frame(target: string, settled: number, pool: string, rtl: boolean): string {
  const chars = Array.from(target)
  return chars
    .map((char, index) => {
      if (/\s/.test(char)) return char
      const resolved = rtl ? index >= chars.length - settled : index < settled
      return resolved ? char : randomFrom(pool)
    })
    .join('')
}

export interface ScrambleOptions {
  /** The finished text. */
  text: string
  /** Target language — picks the character pool and the resolve direction. */
  lang: LanguageCode | string
  /** Position in the list, for the stagger. */
  index?: number
  /** Skip the animation and show `text` at once. */
  disabled?: boolean
}

/**
 * Returns the text as it resolves. Re-runs whenever `text` or `lang` changes,
 * which is exactly when a language switch happens.
 */
export function useScramble({ text, lang, index = 0, disabled = false }: ScrambleOptions): string {
  const reducedMotion = useReducedMotion()
  const skip = disabled || reducedMotion || !text
  const [display, setDisplay] = useState(text)
  const frameRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (skip) {
      setDisplay(text)
      return
    }

    const pool = poolFor(lang)
    const rtl = isRtl(lang)
    const total = Array.from(text).length
    const delay = index * translateTiming.lineStagger

    // Hold the scrambled state through the stagger so a line that hasn't
    // started yet doesn't sit there showing its finished translation.
    setDisplay(frame(text, 0, pool, rtl))

    let start = 0
    const step = (now: number) => {
      if (!start) start = now
      const progress = Math.min((now - start) / translateTiming.lineDuration, 1)
      const settled = Math.round(progress * total)
      setDisplay(progress === 1 ? text : frame(text, settled, pool, rtl))
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
    }

    timeoutRef.current = setTimeout(() => {
      frameRef.current = requestAnimationFrame(step)
    }, delay)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [text, lang, index, skip])

  return display
}

/** Exposed for tests: the pure pieces, with no React or timers involved. */
export const __testing = { frame, poolFor }
