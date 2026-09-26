'use client'

/**
 * Action items for a NoteAI meeting. Checking a box flips it immediately and
 * PATCHes in the background; a failed request rolls that row back and says so,
 * rather than leaving the UI claiming something the server never accepted.
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { ApiActionItem } from '@/lib/types'
import { updateActionItem } from '@/lib/api'
import { cn, formatMeetingDate } from '@/lib/utils'

export function NoteAiActionItems({
  meetingId,
  items,
  onItemsChange,
}: {
  meetingId: string
  items: ApiActionItem[]
  onItemsChange: (items: ApiActionItem[]) => void
}) {
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function toggle(item: ApiActionItem) {
    if (pending.has(item.id)) return
    const next = !item.completed

    setError(null)
    setPending((p) => new Set(p).add(item.id))
    // Optimistic: the box flips now, the request catches up.
    onItemsChange(items.map((i) => (i.id === item.id ? { ...i, completed: next } : i)))

    try {
      const saved = await updateActionItem(meetingId, item.id, next)
      onItemsChange(items.map((i) => (i.id === item.id ? saved : i)))
    } catch {
      onItemsChange(items.map((i) => (i.id === item.id ? { ...i, completed: item.completed } : i)))
      setError('Could not save that change. Please try again.')
    } finally {
      setPending((p) => {
        const copy = new Set(p)
        copy.delete(item.id)
        return copy
      })
    }
  }

  if (items.length === 0) {
    return <p className="py-8 text-md text-fg-3">No action items for this meeting yet.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="mb-2 text-md text-red-600">{error}</p>}

      {items.map((item) => {
        const saving = pending.has(item.id)
        return (
          <label
            key={item.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md p-3 transition-colors hover:bg-surface-2',
              saving && 'opacity-60'
            )}
          >
            <input
              type="checkbox"
              checked={item.completed}
              disabled={saving}
              onChange={() => toggle(item)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-md text-fg-1',
                  item.completed && 'text-fg-3 line-through'
                )}
              >
                {item.title}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-meta">
                {item.assigned_to && <span>{item.assigned_to}</span>}
                {item.due_date && <span>Due {formatMeetingDate(item.due_date)}</span>}
                {saving && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Saving…
                  </span>
                )}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
