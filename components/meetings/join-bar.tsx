'use client'

import { useId, useState } from 'react'
import { Button, Input } from '@/components/ui'

/**
 * Paste a meeting link to have NoteAI join it.
 *
 * Joining isn't built yet, so the bar is honest about that: submitting says
 * so inline rather than pretending to work or silently doing nothing. Upload
 * is absent for the same reason — DESIGN.md's "only show what works" means a
 * control appears when it does something, not before.
 *
 * The platform name is derived from the link purely so the message can name
 * it back; no request is made.
 */

const PLATFORMS: { pattern: RegExp; name: string }[] = [
  { pattern: /(^|\.)zoom\.(us|com)/i, name: 'Zoom' },
  { pattern: /meet\.google\.com/i, name: 'Google Meet' },
  { pattern: /teams\.(microsoft|live)\.com/i, name: 'Microsoft Teams' },
]

/** Names the platform a meeting link belongs to, or null if unrecognised. */
export function detectPlatform(link: string): string | null {
  const trimmed = link.trim()
  if (!trimmed) return null
  let host: string
  try {
    host = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname
  } catch {
    return null
  }
  return PLATFORMS.find(({ pattern }) => pattern.test(host))?.name ?? null
}

export function JoinBar() {
  const [link, setLink] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const inputId = useId()
  const noticeId = useId()

  const platform = detectPlatform(link)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setNotice(
          platform
            ? `Joining meetings is coming next. We recognised this as a ${platform} link.`
            : 'Joining meetings is coming next.'
        )
      }}
      className="border-b border-border-subtle pb-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor={inputId} className="sr-only">
          Meeting link
        </label>
        <Input
          id={inputId}
          type="url"
          mono
          inputMode="url"
          placeholder="Paste a Zoom, Google Meet or Teams link"
          value={link}
          onChange={(event) => {
            setLink(event.target.value)
            if (notice) setNotice(null)
          }}
          aria-describedby={notice ? noticeId : undefined}
          className="sm:flex-1"
        />
        <Button type="submit" variant="primary" disabled={!link.trim()} className="shrink-0">
          Join a meeting
        </Button>
      </div>

      {notice && (
        // role="status" announces the message without stealing focus.
        <p
          id={noticeId}
          role="status"
          className="mt-3 text-small text-muted motion-safe:animate-enter"
        >
          {notice}
        </p>
      )}
    </form>
  )
}
