/**
 * Motion tokens and helpers, from DESIGN.md.
 *
 * DESIGN.md's rule is that motion explains: an animation shows what changed,
 * where something came from, or what happens next. Anything that only looks
 * nice is removed. These tokens keep the timings consistent so that stays
 * true across the app.
 *
 * Constraints encoded here:
 * - Animate only opacity, transform and clip-path. Never layout properties.
 * - Entrances fade and rise 8-18px; exits are faster than entrances.
 * - No bounce, no spin, no infinite motion except live indicators and
 *   skeletons.
 * - prefers-reduced-motion shows the final state instantly.
 *
 * The duration and easing values mirror the CSS variables in
 * app/globals.css, which cover the same tokens for CSS-driven transitions.
 */
'use client'

import { useEffect, useState } from 'react'

/** Durations in milliseconds. */
export const duration = {
  /** Hover, focus, colour. */
  fast: 150,
  /** Toggles, selection. */
  base: 280,
  /** Panels, entrances. */
  slow: 520,
} as const

/** Seconds, for the `motion` package, which works in seconds not ms. */
export const durationSec = {
  fast: duration.fast / 1000,
  base: duration.base / 1000,
  slow: duration.slow / 1000,
} as const

/** DESIGN.md's default easing for everything entering. */
export const easeOut = [0.2, 0.8, 0.2, 1] as const

/** The same curve as a CSS string. */
export const easeOutCss = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

/** Delay between related items, in ms. */
export const stagger = {
  tight: 100,
  loose: 150,
} as const

/** Per-line timings for the translate signature moment. */
export const translateTiming = {
  /** Stagger between lines. */
  lineStagger: 110,
  /** How long one line takes to resolve. */
  lineDuration: 650,
} as const

/** Entrance: fade and rise. Distance stays inside DESIGN.md's 8-18px. */
export const riseIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durationSec.slow, ease: easeOut },
} as const

/** Exit, deliberately faster than the matching entrance. */
export const fadeOut = {
  opacity: 0,
  transition: { duration: durationSec.fast, ease: easeOut },
} as const

/**
 * True when the viewer asked for reduced motion.
 *
 * Starts false and resolves in an effect so server and first client render
 * agree — reading matchMedia during render would hydrate-mismatch. Callers
 * should therefore treat `true` as "strip the animation", which is the safe
 * direction: the final state is always the accessible one.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Wraps a motion prop set so reduced motion collapses it to the final state:
 * no offset, no duration, nothing to wait through.
 *
 *   const props = useMotionSafe(riseIn)
 *   <motion.div {...props} />
 */
export function useMotionSafe<T extends { initial?: unknown; animate?: unknown; transition?: unknown }>(
  props: T
): T | { initial: false; animate: T['animate']; transition: { duration: 0 } } {
  const reduced = useReducedMotion()
  if (!reduced) return props
  return { initial: false, animate: props.animate, transition: { duration: 0 } }
}

/**
 * Stagger delay for item `index`, in seconds.
 * Returns 0 under reduced motion so a list appears at once.
 */
export function useStaggerDelay(index: number, gapMs: number = stagger.tight): number {
  const reduced = useReducedMotion()
  return reduced ? 0 : (index * gapMs) / 1000
}
