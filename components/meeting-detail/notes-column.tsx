'use client'

import { useState } from 'react'
import type { Meeting } from '@/lib/types'
import { ShareModal } from '@/components/share/share-modal'
import { ActionItems } from './action-items'
import { formatMeetingDate } from '@/lib/utils'

/**
 * Inline rename is session-scoped local state, same as the action-item
 * checkboxes below it — there's no persistence layer in this build, so it's
 * a real UI affordance that just doesn't survive a refresh, not a fake save.
 */
export function NotesColumn({ meeting }: { meeting: Meeting }) {
  const [title, setTitle] = useState(meeting.title)
  const [editing, setEditing] = useState(false)

  return (
    <aside className="hidden w-notes-col shrink-0 space-y-5 px-4 pb-8 pt-5 lg:block">
      <div>
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
            }}
            aria-label="Meeting title"
            className="w-full rounded bg-transparent text-xl font-semibold text-fg-1 outline-none ring-1 ring-brand"
          />
        ) : (
          <h1
            role="button"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(true)
            }}
            className="cursor-text truncate rounded text-xl font-semibold text-fg-1 hover:opacity-90"
            title="Click to rename"
          >
            {title}
          </h1>
        )}
        <p className="mt-1 text-xs font-normal text-fg-meta" suppressHydrationWarning>
          {formatMeetingDate(meeting.date)}
        </p>
      </div>

      <ShareModal
        meetingId={meeting.id}
        title={title}
        triggerClassName="h-share-copy w-full justify-center rounded-md border-none bg-brand/10 text-[15px] font-bold text-brand hover:bg-brand hover:text-surface-2"
      />

      <ActionItems items={meeting.actionItems} participants={meeting.participants} />
    </aside>
  )
}
