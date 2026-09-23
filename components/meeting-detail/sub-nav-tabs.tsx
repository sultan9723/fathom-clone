'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn, formatTimecode } from '@/lib/utils'
import type { Meeting } from '@/lib/types'

export type DetailTab = 'summary' | 'transcript' | 'ask' | 'details'

const TABS: { id: DetailTab; label: string; mobileOnly?: boolean }[] = [
  { id: 'summary', label: 'SUMMARY' },
  { id: 'transcript', label: 'TRANSCRIPT' },
  { id: 'ask', label: 'ASK' },
  // The right-hand Notes column (title/share/action items) is hidden below
  // lg — this tab is the only way to reach that content on mobile, so it
  // has no reason to exist once the persistent column is visible.
  { id: 'details', label: 'DETAILS', mobileOnly: true },
]

/**
 * Tab state is local, not URL-synced — the existing ?t= share-link contract
 * already owns the query string, and SPEC doesn't ask for deep-linkable
 * tabs the way it explicitly does for the list page's ?q= search.
 */
export function SubNavTabs({
  active,
  onChange,
  meeting,
}: {
  active: DetailTab
  onChange: (tab: DetailTab) => void
  meeting: Meeting
}) {
  const [copied, setCopied] = useState(false)

  async function copyTranscript() {
    const speakers = new Map(meeting.participants.map((p) => [p.id, p.name]))
    const text = meeting.transcript
      .map(
        (l) =>
          `[${formatTimecode(l.start)}] ${speakers.get(l.speakerId) ?? 'Unknown'}: ${l.text}`
      )
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked by permissions; the button silently no-ops.
    }
  }

  return (
    // Matches the video wrapper's own px-4 sm:px-6 exactly (not a flat px-6)
    // so the tabs line up with the video at every breakpoint, not just desktop.
    <div className="flex h-sub-nav min-w-0 items-center justify-between bg-black px-4 sm:px-6">
      <div className="flex h-full min-w-0 items-center overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'mr-[15px] shrink-0 border-b-2 py-[15px] text-[15px] font-semibold uppercase tracking-wide transition-colors',
                tab.mobileOnly && 'lg:hidden',
                isActive
                  ? 'border-brand text-brand'
                  : 'border-[#1b1b20] text-fg-meta hover:text-fg-2'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {active === 'transcript' && (
        <button
          type="button"
          onClick={copyTranscript}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand/10 px-3 py-1.5 text-[15px] font-semibold text-brand transition-colors hover:bg-brand hover:text-surface-2"
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy Transcript'}
        </button>
      )}
    </div>
  )
}
