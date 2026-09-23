'use client'

import { useState } from 'react'
import { ListChecks, Play } from 'lucide-react'
import type { ActionItem, Participant } from '@/lib/types'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatTimecode } from '@/lib/utils'
import { usePlayer } from './player-provider'

export function ActionItems({
  items,
  participants,
}: {
  items: ActionItem[]
  participants: Participant[]
}) {
  const { seek } = usePlayer()
  // Checked state is client-only: there is no persistence layer in this build,
  // so toggles are deliberately session-scoped rather than faking a save.
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.done]))
  )

  const byId = new Map(participants.map((p) => [p.id, p]))
  const openCount = items.filter((i) => !done[i.id]).length

  return (
    <section
      aria-labelledby="actions-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="actions-heading"
          className="flex items-center gap-2 text-sm font-semibold text-slate-900"
        >
          <ListChecks className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Action items
        </h2>
        <span className="text-xs text-slate-500">
          {openCount} of {items.length} open
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {items.map((item) => {
          const assignee = item.assigneeId ? byId.get(item.assigneeId) : undefined
          const isDone = done[item.id] ?? false
          return (
            <li
              key={item.id}
              className="group flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
            >
              <input
                id={`action-${item.id}`}
                type="checkbox"
                checked={isDone}
                onChange={(e) =>
                  setDone((prev) => ({ ...prev, [item.id]: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`action-${item.id}`}
                  className={cn(
                    'cursor-pointer text-sm leading-relaxed',
                    isDone ? 'text-slate-400 line-through' : 'text-slate-700'
                  )}
                >
                  {item.text}
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {assignee && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Avatar participant={assignee} size="sm" />
                      {assignee.name}
                    </span>
                  )}
                  {item.timestamp !== undefined && (
                    <button
                      type="button"
                      onClick={() => seek(item.timestamp!)}
                      className="inline-flex items-center gap-1 rounded font-mono text-[11px] tabular-nums text-slate-400 transition hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      aria-label={`Jump to ${formatTimecode(item.timestamp)} where this was discussed`}
                    >
                      <Play className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true" />
                      {formatTimecode(item.timestamp)}
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
