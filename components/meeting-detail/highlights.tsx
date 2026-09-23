'use client'

import { Sparkles, Play } from 'lucide-react'
import type { Highlight } from '@/lib/types'
import { cn, formatDuration, formatTimecode } from '@/lib/utils'
import { usePlayer } from './player-provider'

export function Highlights({ highlights }: { highlights: Highlight[] }) {
  const { currentTime, seek } = usePlayer()

  if (highlights.length === 0) return null

  return (
    <section
      aria-labelledby="highlights-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2
        id="highlights-heading"
        className="flex items-center gap-2 text-sm font-semibold text-slate-900"
      >
        <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
        Highlights
      </h2>

      <ul className="mt-3 space-y-1">
        {highlights.map((h) => {
          const isCurrent = currentTime >= h.start && currentTime < h.end
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => seek(h.start)}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  isCurrent ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full transition',
                    isCurrent ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                  aria-hidden="true"
                >
                  <Play className="ml-0.5 h-3 w-3" fill="currentColor" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-700">{h.title}</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
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
