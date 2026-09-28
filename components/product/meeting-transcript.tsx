'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Input, Panel } from '@/components/ui'
import type { ApiTranscript } from '@/lib/types'
import { i18nText, normalizeLanguage } from '@/lib/i18n-text'
import { translateTranscript } from '@/lib/product-api'
import { formatTimecode } from '@/lib/utils'
import { usePlayer } from '@/components/meeting-detail/player-provider'
import { LanguageSelect, ScriptText, useReadingLanguage } from './preferences'
import { useResource } from './use-resource'
import { Notice } from './states'

function highlight(text: string, query: string): ReactNode {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return text
  const nodes: ReactNode[] = []
  let start = 0
  let index = text.toLocaleLowerCase().indexOf(needle)
  while (index !== -1) {
    nodes.push(text.slice(start, index), <mark key={index}>{text.slice(index, index + needle.length)}</mark>)
    start = index + needle.length
    index = text.toLocaleLowerCase().indexOf(needle, start)
  }
  nodes.push(text.slice(start))
  return nodes
}

export function MeetingTranscript({ meetingId, lines, source, query, onJump, jumpVersion = 0 }: { meetingId: string; lines: ApiTranscript[]; source: string; query: string; onJump: (seconds: number) => void; jumpVersion?: number }) {
  const { language, setLanguage } = useReadingLanguage()
  const { currentTime } = usePlayer()
  const [search, setSearch] = useState(query)
  useEffect(() => { if (jumpVersion) setSearch('') }, [jumpVersion])
  const activeNode = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const needsTranslation = lines.some(line => normalizeLanguage(line.original_language || source) !== language)
  const translation = useResource(signal => needsTranslation ? translateTranscript(meetingId, language, lines, signal) : Promise.resolve({} as Record<string, string>), `${meetingId}:${language}:${lines.map(line => line.id).join(',')}`)
  const translated = needsTranslation && !!translation.data && !translation.error && !translation.canceled
  const active = lines.reduce<ApiTranscript | null>((last, line) => line.timestamp_seconds <= currentTime ? line : last, null)
  const speakers = [...new Set(lines.map(line => line.speaker_name || 'Unknown speaker'))]
  const visible = lines.filter(line => !search.trim() || `${line.speaker_name} ${line.text} ${translation.data?.[line.id] ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  useEffect(() => {
    const list = listRef.current
    const node = activeNode.current
    if (list && node) {
      const top = node.offsetTop - list.offsetTop
      if (top < list.scrollTop || top + node.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTo({ top: Math.max(0, top - 24), behavior: 'instant' })
    }
  }, [active?.id, search])
  return <Panel className="meeting-main-panel"><div className="panel-heading"><h2 id="transcript-heading">Transcript</h2><LanguageSelect value={language} onChange={setLanguage} /></div>
    <Input type="search" aria-label="Find in this transcript" placeholder="Find in this transcript" value={search} onChange={event => setSearch(event.target.value)} />
    <p className="product-caption">{translated ? `Your view · ${i18nText(language).label}, with original below` : 'Your view · original'} · {visible.length} lines</p>
    {needsTranslation && translation.loading && <div role="status" className="product-caption">Translating the transcript… Original remains available. <Button onClick={translation.cancel}>Cancel translation</Button></div>}
    {needsTranslation && (translation.error || translation.canceled) && <Notice title="Showing the original for now"><p>The {i18nText(language).label} translation {translation.canceled ? 'was canceled' : 'isn’t available right now'}. The transcript and saved action items are still available.</p><Button onClick={translation.retry}>Retry translation</Button></Notice>}
    {!lines.length && <p className="product-caption">No transcript has been recorded for this meeting.</p>}
    {!!lines.length && !visible.length && <Notice title="No matching lines"><Button onClick={() => setSearch('')}>Clear transcript search</Button></Notice>}
    <div ref={listRef} className="transcript-list" aria-labelledby="transcript-heading">{visible.map(line => {
      const name = line.speaker_name || 'Unknown speaker'
      const originalLanguage = line.original_language || source
      return <div key={line.id} id={`transcript-${line.timestamp_seconds}`} className="transcript-row" data-active={active?.id === line.id} ref={active?.id === line.id ? activeNode : undefined}>
        <button type="button" className="source-time" aria-current={active?.id === line.id ? 'true' : undefined} aria-label={`Jump to ${formatTimecode(line.timestamp_seconds)}, ${name}`} onClick={() => onJump(line.timestamp_seconds)}>{formatTimecode(line.timestamp_seconds)}</button><span className={`transcript-speaker speaker-${speakers.indexOf(name) % 3}`}>{name}</span><div className="transcript-text"><ScriptText language={translated ? language : originalLanguage}>{highlight(translated ? translation.data?.[line.id] ?? line.text : line.text, search)}</ScriptText>{translated && <span className="original-text"><ScriptText language={originalLanguage}>{highlight(line.text, search)}</ScriptText></span>}</div>
      </div>
    })}</div>
  </Panel>
}
