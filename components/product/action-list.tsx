'use client'

import { useRef, useState, type FormEvent } from 'react'
import type { ApiActionItem, ApiTranscript } from '@/lib/types'
import { addAction, saveAction } from '@/lib/product-api'
import { evidenceTimes } from '@/lib/product'
import { formatTimecode } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Notice } from './states'
import { TranslatedText } from './translated-text'

export function ActionList({ meetingId, items, onSaved, source = 'en', lines = [], onJump, allowAdd = true }: {
  meetingId: string; items: ApiActionItem[]; onSaved: (item: ApiActionItem) => void; source?: string;
  lines?: ApiTranscript[]; onJump?: (seconds: number) => void; allowAdd?: boolean
}) {
  const [pending, setPending] = useState<string[]>([])
  const pendingIds = useRef(new Set<string>())
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState<ApiActionItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')
  const [due, setDue] = useState('')
  const addingRef = useRef(false)
  async function toggle(item: ApiActionItem) {
    if (pendingIds.current.has(item.id)) return
    pendingIds.current.add(item.id); setPending([...pendingIds.current]); setError(null); setFailed(null)
    try { onSaved(await saveAction(meetingId, item.id, !item.completed)) }
    catch (failure) { setError((failure as Error).message); setFailed(item) }
    finally { pendingIds.current.delete(item.id); setPending([...pendingIds.current]) }
  }
  async function create(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || addingRef.current) return
    addingRef.current = true; setAdding(true); setError(null); setFailed(null)
    try { onSaved(await addAction(meetingId, { title: title.trim(), assigned_to: owner.trim() || null, due_date: due || null })); setTitle(''); setOwner(''); setDue('') }
    catch (failure) { setError((failure as Error).message) }
    finally { addingRef.current = false; setAdding(false) }
  }
  return <div>
    <p className="product-caption" role="status">{items.filter(item => item.completed).length} of {items.length} done</p>
    {!items.length && <p className="product-caption">No action items saved yet.</p>}
    <div className="action-list">{items.map(item => <div key={item.id} className="action-row" data-completed={item.completed}>
      <label className="action-checkbox"><input type="checkbox" checked={item.completed} disabled={pending.includes(item.id)} aria-label={`Mark ${item.title} ${item.completed ? 'incomplete' : 'complete'}`} onChange={() => toggle(item)} /></label><div className="action-copy"><TranslatedText text={item.title} source={source} className="action-title" /><small>{item.assigned_to || 'Unassigned'}{item.due_date && ` · Due ${item.due_date}`}{pending.includes(item.id) && ' · Saving…'}</small>{onJump && <div className="source-buttons">{evidenceTimes(item.title, lines).map(seconds => <button key={seconds} type="button" onClick={() => onJump(seconds)}>Jump to {formatTimecode(seconds)}</button>)}</div>}</div>
    </div>)}</div>
    {items.length > 0 && !items.some(item => evidenceTimes(item.title, lines).length) && <p className="product-caption">Source timestamps were not supplied for these action items.</p>}
    {error && <Notice title="Could not save the action item" warning onRetry={failed ? () => toggle(failed) : undefined}>{error}</Notice>}
    {allowAdd && <details className="action-add-form"><summary>Add an action item</summary><form onSubmit={create} className="product-form"><label className="product-field">Action<input required maxLength={255} value={title} onChange={event => setTitle(event.target.value)} disabled={adding} /></label><label className="product-field">Owner<input maxLength={255} value={owner} onChange={event => setOwner(event.target.value)} disabled={adding} /></label><label className="product-field">Due date<input type="date" value={due} onChange={event => setDue(event.target.value)} disabled={adding} /></label><Button type="submit" disabled={adding || !title.trim()}>{adding ? 'Saving…' : 'Save action item'}</Button>{adding && <span role="status" className="product-caption">Saving your action item…</span>}</form></details>}
  </div>
}
