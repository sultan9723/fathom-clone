import type { ReactNode } from 'react'

/**
 * Minimal renderer for the one shape of "markdown" Ask answers actually
 * produce: `- ` bullets, `  ↳ ` continuation lines (MockProvider's
 * forward-walk quotes), and inline `[m:ss]`/`[h:mm:ss]` timestamps. A full
 * markdown library (react-markdown) would still need a custom plugin to
 * make timestamps clickable, and everything else in these answers (bold,
 * links, tables, headers) never actually occurs — so parsing the real,
 * narrow surface by hand is less code than wiring up a library plus a
 * plugin for the one piece of behavior that matters.
 */

const TIMESTAMP = /\[(\d{1,2}(?::[0-5]\d){1,2})\]/g

function timestampToSeconds(text: string): number {
  const parts = text.split(':').map(Number)
  return parts.length === 3
    ? parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
    : parts[0]! * 60 + parts[1]!
}

/** Splits `text` on [m:ss] tokens, rendering each as a clickable button. */
function renderInline(text: string, onTimestamp: (seconds: number) => void, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0
  let i = 0
  TIMESTAMP.lastIndex = 0
  for (const match of text.matchAll(TIMESTAMP)) {
    const start = match.index!
    if (start > cursor) nodes.push(text.slice(cursor, start))
    const seconds = timestampToSeconds(match[1]!)
    nodes.push(
      <button
        key={`${keyPrefix}-ts-${i++}`}
        type="button"
        onClick={() => onTimestamp(seconds)}
        className="rounded bg-brand/10 px-1 py-0.5 font-mono text-[13px] text-brand hover:bg-brand hover:text-surface-2"
      >
        {match[0]}
      </button>
    )
    cursor = start + match[0].length
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

export function renderAskMarkdown(text: string, onTimestamp: (seconds: number) => void): ReactNode {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let bulletBuffer: ReactNode[] = []

  function flushBullets() {
    if (bulletBuffer.length === 0) return
    blocks.push(<ul key={`ul-${blocks.length}`} className="list-disc space-y-1.5 pl-5">{bulletBuffer}</ul>)
    bulletBuffer = []
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      bulletBuffer.push(
        <li key={`li-${i}`}>{renderInline(trimmed.slice(2), onTimestamp, `li-${i}`)}</li>
      )
    } else if (trimmed.startsWith('↳')) {
      bulletBuffer.push(
        <li key={`li-${i}`} className="ml-4 list-none text-fg-2">
          {renderInline(trimmed.replace(/^↳\s*/, ''), onTimestamp, `co-${i}`)}
        </li>
      )
    } else if (trimmed) {
      flushBullets()
      blocks.push(<p key={`p-${i}`}>{renderInline(trimmed, onTimestamp, `p-${i}`)}</p>)
    }
    // blank lines just create separation via the blocks' own spacing — no node needed.
  })
  flushBullets()

  return <div className="space-y-2">{blocks}</div>
}
