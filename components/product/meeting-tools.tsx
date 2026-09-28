'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import type { ApiActionItem, ApiMeeting, ApiTranscript } from '@/lib/types'
import { editMeeting, removeMeeting } from '@/lib/product-api'
import { formatTimecode } from '@/lib/utils'

export function MeetingTools({ meeting, lines, actions, summary, onUpdated, complete }: { meeting: ApiMeeting; lines: ApiTranscript[]; actions: ApiActionItem[]; summary: string; onUpdated: (meeting: ApiMeeting) => void; complete: boolean }) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'edit' | 'delete' | 'share'>('share')
  const [title, setTitle] = useState(meeting.title)
  const [description, setDescription] = useState(meeting.description ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [fallback, setFallback] = useState('')
  const pending = useRef(false)
  function open(next: typeof mode) { setMode(next); setMessage(''); setFallback(''); dialog.current?.showModal() }
  async function save() {
    if (pending.current || !title.trim()) return
    pending.current = true; setBusy(true); setMessage('')
    try { onUpdated(await editMeeting(meeting.id, { title: title.trim(), description: description.trim() })); dialog.current?.close() }
    catch (error) { setMessage((error as Error).message) }
    finally { pending.current = false; setBusy(false) }
  }
  async function erase() {
    if (pending.current) return
    pending.current = true; setBusy(true); setMessage('')
    try { await removeMeeting(meeting.id); router.push('/meetings'); router.refresh() }
    catch (error) { setMessage((error as Error).message) }
    finally { pending.current = false; setBusy(false) }
  }
  function exportMeeting() {
    const data = { meeting, transcript: lines, action_items: actions, summary: summary || null, summary_persisted: false }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `noteai-${meeting.id}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function copyRecap() {
    const recap = [meeting.title, meeting.description, summary, 'Action items', ...actions.map(item => `${item.completed ? '[x]' : '[ ]'} ${item.title} — ${item.assigned_to || 'Unassigned'}`), 'Transcript', ...lines.map(line => `[${formatTimecode(line.timestamp_seconds)}] ${line.speaker_name || 'Unknown'}: ${line.text}`), window.location.href].filter(Boolean).join('\n\n')
    try { await navigator.clipboard.writeText(recap); setMessage('Recap copied. Choose where to share it.'); setFallback('') }
    catch { setFallback(recap); setMessage('Clipboard access was unavailable. Select and copy the recap below.') }
  }
  return <><div className="product-actions"><Button onClick={exportMeeting} disabled={!complete}>Export</Button><Button onClick={() => open('share')} disabled={!complete}>Share recap</Button><Button onClick={() => open('edit')}>Edit</Button><Button onClick={() => open('delete')}>Delete</Button></div>
    <dialog ref={dialog} className="meeting-dialog" aria-labelledby="meeting-dialog-title" onCancel={event => { if (busy) event.preventDefault() }}><h2 id="meeting-dialog-title">{mode === 'edit' ? 'Edit meeting' : mode === 'delete' ? 'Delete this meeting?' : 'Share a recap'}</h2>
      {mode === 'edit' && <form onSubmit={event => { event.preventDefault(); void save() }} className="product-form"><label className="product-field">Title<input required maxLength={255} value={title} disabled={busy} onChange={event => setTitle(event.target.value)} /></label><label className="product-field">Description<textarea value={description} disabled={busy} onChange={event => setDescription(event.target.value)} /></label><Button type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></form>}
      {mode === 'delete' && <><p>This permanently deletes “{meeting.title}”, its transcript, saved translations, notes and action items from this workspace.</p><div className="product-actions"><Button onClick={erase} disabled={busy}>{busy ? 'Deleting…' : 'Delete meeting permanently'}</Button></div></>}
      {mode === 'share' && <><p>Copy the loaded transcript, summary and action items. Only share with people who should have these notes. This workspace does not provide private share links or recipient access controls.</p><div className="product-actions"><Button onClick={copyRecap}>Copy recap</Button></div>{fallback && <textarea className="copy-fallback" aria-label="Recap to copy" readOnly value={fallback} onFocus={event => event.currentTarget.select()} />}</>}
      {message && <p role="status">{message}</p>}<div className="product-actions"><Button disabled={busy} onClick={() => dialog.current?.close()}>{mode === 'share' ? 'Close' : 'Cancel'}</Button></div>
    </dialog>
  </>
}
