'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ApiActionItem, ApiMeeting, ApiTranscript } from '@/lib/types'
import { deleteMeeting, updateMeeting } from '@/lib/api'
import { formatTimecode } from '@/lib/utils'
import { Button, Panel } from '@/components/ui'

/**
 * What you can do with a meeting once you are looking at it: take a copy out,
 * correct its details, or remove it.
 *
 * Export and Share act on the data already on screen, so they are disabled
 * until the transcript has loaded — exporting a half-loaded meeting would
 * write a file that quietly omits most of it. The export records
 * `summary_persisted: false` because the summary is generated on demand and
 * never stored, so a reader can tell it came from this session rather than
 * the database.
 *
 * Delete is irreversible and confirms first, naming the meeting and listing
 * exactly what goes with it.
 */

type Mode = 'edit' | 'delete' | null

export function MeetingTools({
  meeting,
  transcripts,
  actionItems,
  summary,
  ready,
  onUpdated,
}: {
  meeting: ApiMeeting
  transcripts: ApiTranscript[]
  actionItems: ApiActionItem[]
  /** Generated on demand; empty when none has been written this session. */
  summary: string
  /** False while the transcript is still loading. */
  ready: boolean
  onUpdated: (meeting: ApiMeeting) => void
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(null)
  const [title, setTitle] = useState(meeting.title)
  const [description, setDescription] = useState(meeting.description ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [copyFallback, setCopyFallback] = useState<string | null>(null)
  // Guards a second submit while the first request is still in flight; state
  // updates are async, so `busy` alone can let a fast double-click through.
  const inFlight = useRef(false)

  const open = (next: Mode) => {
    setTitle(meeting.title)
    setDescription(meeting.description ?? '')
    setMessage(null)
    setCopyFallback(null)
    setMode(next)
  }

  const close = () => {
    if (busy) return
    setMode(null)
    setMessage(null)
  }

  function buildRecap(): string {
    return [
      meeting.title,
      meeting.description,
      summary,
      actionItems.length ? 'Action items' : '',
      ...actionItems.map(
        (item) => `${item.completed ? '[x]' : '[ ]'} ${item.title}${item.assigned_to ? ` — ${item.assigned_to}` : ''}`
      ),
      transcripts.length ? 'Transcript' : '',
      ...transcripts.map(
        (line) =>
          `[${formatTimecode(line.timestamp_seconds)}] ${line.speaker_name?.trim() || 'Unknown'}: ${line.text}`
      ),
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  function exportJson() {
    const payload = {
      meeting,
      transcript: transcripts,
      action_items: actionItems,
      summary: summary || null,
      // The summary is generated per session, never stored on the meeting.
      summary_persisted: false,
      exported_at: new Date().toISOString(),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `noteai-${meeting.id}.json`
    link.click()
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Exported to your downloads.')
  }

  async function copyRecap() {
    const recap = buildRecap()
    try {
      await navigator.clipboard.writeText(recap)
      setCopyFallback(null)
      setMessage('Recap copied. Choose where to share it.')
    } catch {
      // Clipboard access is refused without a user gesture, over http, or by
      // permission — show the text so it can still be copied by hand.
      setCopyFallback(recap)
      setMessage('Clipboard access was unavailable. Copy the recap below.')
    }
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault()
    if (inFlight.current || !title.trim()) return
    inFlight.current = true
    setBusy(true)
    setMessage(null)
    try {
      onUpdated(await updateMeeting(meeting.id, { title: title.trim(), description: description.trim() }))
      setMode(null)
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setMessage(null)
    try {
      await deleteMeeting(meeting.id)
      router.push('/meetings')
      router.refresh()
    } catch (error) {
      setMessage((error as Error).message)
      inFlight.current = false
      setBusy(false)
    }
  }

  return (
    <Panel as="section" aria-labelledby="tools-heading" className="p-5">
      <h2 id="tools-heading" className="text-label-sm uppercase text-faint">
        This meeting
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={exportJson} disabled={!ready}>
          Export
        </Button>
        <Button variant="secondary" onClick={copyRecap} disabled={!ready}>
          Share recap
        </Button>
        <Button variant="secondary" onClick={() => open('edit')}>
          Edit
        </Button>
        <Button variant="secondary" onClick={() => open('delete')}>
          Delete
        </Button>
      </div>

      {!ready && (
        <p className="mt-3 text-small text-faint">
          Export and Share become available once the transcript has loaded.
        </p>
      )}

      {mode === 'edit' && (
        <form onSubmit={saveEdit} className="mt-5 border-t border-border-subtle pt-5">
          <h3 className="text-body-sm font-medium text-text">Edit meeting</h3>
          <label htmlFor="edit-title" className="mt-4 block text-label-sm uppercase text-faint">
            Title
          </label>
          <input
            id="edit-title"
            required
            maxLength={255}
            value={title}
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-input w-full rounded-control border border-border bg-surface px-4 text-text disabled:opacity-50"
          />
          <label htmlFor="edit-description" className="mt-4 block text-label-sm uppercase text-faint">
            Description
          </label>
          <textarea
            id="edit-description"
            rows={3}
            value={description}
            disabled={busy}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-control border border-border bg-surface p-4 text-text disabled:opacity-50"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={busy || !title.trim()}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="secondary" onClick={close} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {mode === 'delete' && (
        <div className="mt-5 rounded-card border border-warn-border bg-surface-2 p-4">
          <h3 className="text-body-sm font-medium text-warn">
            Delete &ldquo;{meeting.title}&rdquo;?
          </h3>
          <p className="mt-2 text-small text-muted">
            This permanently removes the meeting, its transcript, action items, notes and
            cached translations. It cannot be undone.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={confirmDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete permanently'}
            </Button>
            <Button variant="secondary" onClick={close} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 text-small text-muted">
          {message}
        </p>
      )}

      {copyFallback && (
        <textarea
          readOnly
          aria-label="Recap to copy"
          value={copyFallback}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-3 h-40 w-full rounded-control border border-border bg-surface p-4 font-mono text-small text-text-2"
        />
      )}
    </Panel>
  )
}
