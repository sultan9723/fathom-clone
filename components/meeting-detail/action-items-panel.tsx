'use client'

import { useState } from 'react'
import type { ApiActionItem } from '@/lib/types'
import { updateActionItem } from '@/lib/api'
import { Panel } from '@/components/ui'

/**
 * Action items, toggled against PATCH /action-items/{id}.
 *
 * The checkbox updates optimistically and rolls back if the request fails —
 * a tick that silently didn't save is worse than one that visibly bounces.
 * A real <input type="checkbox"> inside a <label>, per DESIGN.md.
 */
export function ActionItemsPanel({
  meetingId,
  items,
  onItemsChange,
}: {
  meetingId: string
  items: ApiActionItem[]
  onItemsChange: (items: ApiActionItem[]) => void
}) {
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [failed, setFailed] = useState<string | null>(null)

  const toggle = async (item: ApiActionItem) => {
    const next = !item.completed
    setFailed(null)
    setPending((current) => new Set(current).add(item.id))
    onItemsChange(items.map((i) => (i.id === item.id ? { ...i, completed: next } : i)))

    try {
      const saved = await updateActionItem(meetingId, item.id, next)
      onItemsChange(items.map((i) => (i.id === item.id ? saved : i)))
    } catch {
      onItemsChange(items.map((i) => (i.id === item.id ? { ...i, completed: !next } : i)))
      setFailed("That didn't save. Please try again.")
    } finally {
      setPending((current) => {
        const copy = new Set(current)
        copy.delete(item.id)
        return copy
      })
    }
  }

  return (
    <Panel as="section" aria-labelledby="actions-heading" className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="actions-heading" className="text-caption uppercase text-faint">
          Action items
        </h2>
        {items.length > 0 && (
          <span className="font-mono text-caption tabular-nums text-faint">
            {items.filter((item) => item.completed).length}/{items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-small text-muted">
          No action items were captured for this meeting.
        </p>
      ) : (
        <ul className="mt-4 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-chip px-2 py-2 transition-colors duration-fast ease-out-design hover:bg-surface-hover ${
                  pending.has(item.id) ? 'opacity-60' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={pending.has(item.id)}
                  onChange={() => toggle(item)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--accent)]"
                />
                <span className="min-w-0">
                  <span
                    className={`block text-body ${
                      item.completed ? 'text-faint line-through' : 'text-text'
                    }`}
                  >
                    {item.title}
                  </span>
                  {(item.assigned_to || item.due_date) && (
                    <span className="mt-0.5 block text-small text-muted">
                      {[item.assigned_to, item.due_date].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {failed && (
        <p role="alert" className="mt-3 text-small text-warn">
          {failed}
        </p>
      )}
    </Panel>
  )
}
