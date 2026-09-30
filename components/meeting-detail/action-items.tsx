'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
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

  return (
    <section aria-labelledby="actions-heading">
      <h3
        id="actions-heading"
        className="text-[15px] font-bold uppercase tracking-[0.375px] text-fg-3"
      >
        Action Items
      </h3>

      {items.length === 0 ? (
        <p className="mt-3 rounded-md bg-topbar px-[27px] py-4 text-base italic font-normal text-fg-3">
          No action items for this call.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((item) => {
            const assignee = item.assigneeId ? byId.get(item.assigneeId) : undefined
            const isDone = done[item.id] ?? false
            return (
              <li key={item.id} className="flex items-start gap-3 py-1.5">
                <input
                  id={`action-${item.id}`}
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) =>
                    setDone((prev) => ({ ...prev, [item.id]: e.target.checked }))
                  }
                  className="mt-1 h-action-checkbox w-action-checkbox shrink-0 rounded border-line bg-transparent text-brand accent-brand focus:ring-brand"
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`action-${item.id}`}
                    className={cn(
                      'cursor-pointer text-[15px] font-light leading-6',
                      isDone ? 'text-fg-3 line-through' : 'text-fg-1'
                    )}
                  >
                    {item.text}
                  </label>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    {assignee && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-fg-3">
                        <Avatar participant={assignee} size="sm" />
                        {assignee.name}
                      </span>
                    )}
                    {item.timestamp !== undefined && (
                      <button
                        type="button"
                        onClick={() => seek(item.timestamp!)}
                        className="inline-flex items-center gap-1 rounded font-mono text-[11px] tabular-nums text-brand transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
      )}
    </section>
  )
}
