'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ApiActionItem } from '@/lib/types'
import { listMeetings, readActions } from '@/lib/product-api'
import { Panel, ButtonLink } from '@/components/ui'
import { ActionList } from './action-list'
import { LanguageSelect, useReadingLanguage } from './preferences'
import { EmptyState, LoadingState, Notice } from './states'
import { useResource } from './use-resource'

export function ActionLibrary() {
  const { language, setLanguage } = useReadingLanguage()
  const [filter, setFilter] = useState('all')
  const [saved, setSaved] = useState<Record<string, ApiActionItem>>({})
  const result = useResource(async signal => {
    const meetings = await listMeetings(signal)
    const groups = []
    // Bound concurrent requests for large libraries, retaining successful groups.
    for (let i = 0; i < meetings.length; i += 5) {
      signal.throwIfAborted()
      const batch = meetings.slice(i, i + 5)
      const fetched = await Promise.allSettled(batch.map(meeting => readActions(meeting.id, signal)))
      groups.push(...fetched.map((items, index) => ({ meeting: batch[index], items: items.status === 'fulfilled' ? items.value : [], failed: items.status === 'rejected' })))
    }
    return groups
  }, 'all-actions')
  const groups = result.data ?? []
  const failed = groups.filter(group => group.failed)
  const visible = groups.map(group => ({ ...group, items: group.items.map(item => saved[item.id] ?? item).filter(item => filter === 'all' || (filter === 'done' ? item.completed : !item.completed)) })).filter(group => group.items.length)
  return <div className="product-page"><header className="product-page-header"><div><h1>Action items</h1><p>Follow-ups from your saved meetings, with their owners and completion state.</p></div><LanguageSelect value={language} onChange={setLanguage} /></header><div className="library-toolbar"><div className="library-filters" role="group" aria-label="Action-item filter">{['all', 'open', 'done'].map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Done'}</button>)}</div></div>
    {result.loading ? <LoadingState label="Loading action items" onCancel={result.cancel} /> : result.error || result.canceled ? <Notice title={result.canceled ? 'Loading canceled' : 'Could not load action items'} warning={!!result.error} onRetry={result.retry}>{result.error}</Notice> : <>
      {!!failed.length && <Notice title={`${failed.length} meeting${failed.length === 1 ? '' : 's'} could not be loaded`} warning onRetry={result.retry}>Other action items are shown below.</Notice>}
      {!visible.length && !failed.length && <EmptyState title="No action items to show" action={<ButtonLink href="/meetings">Open meetings</ButtonLink>}>Open a meeting to add follow-ups, or try another filter.</EmptyState>}
      {visible.map(group => <Panel key={group.meeting.id} className="product-section"><h2><Link className="product-text-link" href={`/meetings/${encodeURIComponent(group.meeting.id)}`}>{group.meeting.title}</Link></h2><ActionList meetingId={group.meeting.id} items={group.items} source={group.meeting.languages?.split(',')[0]?.trim() || 'en'} allowAdd={false} onSaved={item => setSaved(current => ({ ...current, [item.id]: item }))} /></Panel>)}
    </>}
  </div>
}
