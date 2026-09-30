'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * The background field behind every page.
 *
 * Two soft glows drifting in opposite directions is the default ambient
 * treatment, and it is fine as wallpaper. The hero gets more, because it is
 * the one screen where the background is doing persuasive work rather than
 * just filling space.
 *
 * The hero variant adds:
 *
 * 1. A third, deeper glow on a longer period. Three loops at 19s / 23s / 29s
 *    have a least-common-multiple measured in hours, so the composite never
 *    visibly repeats — the thing that makes two-blob backgrounds read as a
 *    loop is that you can catch them resetting.
 *
 * 2. "Signal rails" — a very faint field of horizontal lines, drifting
 *    upward, that reads as transcript lines moving past behind the words.
 *    It is the product's own subject used as texture rather than a generic
 *    mesh. Tuned to roughly 6% effective alpha — felt more than seen, and
 *    masked away from the centre so it never competes with the headline.
 *
 * 3. Parallax. The field translates at 0.12x the scroll offset, so it sits
 *    behind the page rather than stuck to the glass. The listener is passive
 *    and rAF-throttled, and writes one custom property that only feeds a
 *    transform — no layout is read or written during scroll.
 *
 * Everything animates transform and opacity only. Under
 * prefers-reduced-motion the animations are off (via motion-safe:) AND the
 * scroll listener is never attached, so the field renders in its resting
 * position: still fully visible, simply not moving.
 */
export function AmbientBackground({ hero = false }: { hero?: boolean }) {
  const field = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hero) return
    // Reduced motion means no parallax at all, not slower parallax.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const node = field.current
    if (!node) return

    let frame = 0
    const update = () => {
      frame = 0
      // scrollY is read once per frame, outside any style write, and feeds a
      // transform only — nothing here can force a reflow.
      node.style.setProperty('--parallax', `${window.scrollY * 0.12}px`)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [hero])

  return (
    <div
      ref={field}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={hero ? { transform: 'translate3d(0, calc(var(--parallax, 0px) * -1), 0)' } : undefined}
    >
      <div
        className="absolute -left-[150px] -top-[200px] h-[700px] w-[700px] rounded-full blur-[10px] motion-safe:animate-drift-a"
        style={{
          background: 'radial-gradient(circle, rgba(74,222,128,0.16) 0%, rgba(74,222,128,0) 70%)',
        }}
      />
      <div
        className="absolute -bottom-[250px] -right-[150px] h-[800px] w-[800px] rounded-full blur-[10px] motion-safe:animate-drift-b"
        style={{
          background: 'radial-gradient(circle, rgba(125,180,255,0.10) 0%, rgba(125,180,255,0) 70%)',
        }}
      />

      {hero && (
        <>
          {/* The third glow sits low and centre, filling the gap the other two
              leave under the headline, on the longest period of the three. */}
          <div
            className="absolute -bottom-[320px] left-1/2 h-[820px] w-[820px] -translate-x-1/2 rounded-full blur-[10px] motion-safe:animate-drift-c"
            style={{
              background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, rgba(74,222,128,0) 70%)',
            }}
          />
          {/* Signal rails. Masked to fade out at the top and bottom so they
              never end on a hard edge, and kept off the centre band where the
              headline sits. */}
          <div
            className={cn(
              'absolute inset-x-0 top-0 h-[180%] opacity-70 motion-safe:animate-rails'
            )}
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(74,222,128,0.09) 0px, rgba(74,222,128,0.09) 1px, transparent 1px, transparent 22px)',
              maskImage:
                'radial-gradient(ellipse 80% 55% at 50% 40%, transparent 30%, black 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 80% 55% at 50% 40%, transparent 30%, black 75%)',
            }}
          />
        </>
      )}
    </div>
  )
}
