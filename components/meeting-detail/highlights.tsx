'use client'

import { Sparkles, Play } from 'lucide-react'
import type { Highlight } from '@/lib/types'
import { cn, formatDuration, formatTimecode } from '@/lib/utils'
import { usePlayer } from './player-provider'

export function Highlights({ highlights }: { highlights: Highlight[] }) {
  const { currentTime, seek } = usePlayer()

  if (highlights.length === 0) return null

  return (
    <section aria-labelledby="highlights-heading" className="mt-6">
      <h3
        id="highlights-heading"
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-3"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Highlights
      </h3>

      <ul className="mt-2 space-y-1">
        {highlights.map((h) => {
          const isCurrent = currentTime >= h.start && currentTime < h.end
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => seek(h.start)}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  isCurrent ? 'bg-brand/15' : 'hover:bg-surface-4'
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full transition',
                    isCurrent ? 'bg-brand text-surface-2' : 'bg-surface-5 text-fg-2'
                  )}
                  aria-hidden="true"
                >
                  <Play className="ml-0.5 h-3 w-3" fill="currentColor" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-light text-fg-1">{h.title}</span>
                  <span className="font-mono text-[11px] tabular-nums text-fg-3">
                    {formatTimecode(h.start)} · {formatDuration(h.end - h.start)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
