'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Copy, Check, X } from 'lucide-react'
import { formatTimecode } from '@/lib/utils'
import { usePlayer } from '@/components/meeting-detail/player-provider'

/**
 * Copies a link to the current position. `?t=` is read back by the detail page
 * and handed to the PlayerProvider as its initial seek, so a shared link opens
 * at the moment the sender was looking at.
 */
export function ShareModal({ meetingId, title }: { meetingId: string; title: string }) {
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="share-title" className="text-sm font-semibold text-slate-900">
                  Share meeting
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">{title}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={withTimestamp}
                onChange={(e) => setWithTimestamp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Start at {formatTimecode(seconds)}
            </label>

            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Share link"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={copy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
