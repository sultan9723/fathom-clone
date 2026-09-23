'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Copy, Check, X } from 'lucide-react'
import { cn, formatTimecode } from '@/lib/utils'
import { usePlayer } from '@/components/meeting-detail/player-provider'

/**
 * Copies a link to the current position. `?t=` is read back by the detail page
 * and handed to the PlayerProvider as its initial seek, so a shared link opens
 * at the moment the sender was looking at.
 */
export function ShareModal({
  meetingId,
  title,
  triggerClassName,
}: {
  meetingId: string
  title: string
  /** Lets callers (e.g. the Notes column) fit the trigger to their own layout. */
  triggerClassName?: string
}) {
  const { currentTime } = usePlayer()
  const [open, setOpen] = useState(false)
  const [withTimestamp, setWithTimestamp] = useState(true)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')
  const closeRef = useRef<HTMLButtonElement | null>(null)

  // window is not available during SSR.
  useEffect(() => setOrigin(window.location.origin), [])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const seconds = Math.floor(currentTime)
  const url = `${origin}/meetings/${meetingId}${withTimestamp && seconds > 0 ? `?t=${seconds}` : ''}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked by permissions; the input stays selectable.
      setCopied(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          triggerClassName
        )}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            className="w-share-modal max-w-full rounded-lg bg-topbar p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="share-title" className="text-xl font-semibold text-fg-1">
                  Share meeting
                </h2>
                <p className="mt-0.5 truncate text-xs text-fg-3">{title}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 rounded p-1 text-fg-3 transition hover:text-fg-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={withTimestamp}
                onClick={() => setWithTimestamp((v) => !v)}
                className={cn(
                  'relative h-toggle w-toggle shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-topbar',
                  withTimestamp ? 'bg-brand' : 'bg-line'
                )}
              >
                <span
                  className={cn(
                    // Anchored explicitly at left-[2px] rather than left
                    // unset — the browser's "static position" fallback for
                    // an absolutely-positioned lone child doesn't reliably
                    // resolve to 0 here, which was pushing the thumb a full
                    // track-width past its track when translated.
                    'absolute left-[2px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full bg-white transition-transform',
                    withTimestamp ? 'translate-x-[14px]' : 'translate-x-0'
                  )}
                />
              </button>
              <span className="text-sm text-fg-2">Start at {formatTimecode(seconds)}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Share link"
                className="min-w-0 flex-1 rounded-md border border-surface-5 bg-surface-2 px-3 py-2 font-mono text-xs text-fg-2 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-share-copy shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-semibold text-surface-2 transition hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-topbar"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
