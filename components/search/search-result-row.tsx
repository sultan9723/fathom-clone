import Link from 'next/link'
import type { SearchResult } from '@/lib/search'
import { formatTimestamp } from '@/lib/search'

/**
 * The whole row navigates to the exact moment — the timestamp renders as a
 * styled badge for scannability, but it isn't a second nested interactive
 * element (a button/link inside a link isn't valid HTML, and one clear
 * click target per row is simpler than two overlapping ones).
 */
export function SearchResultRow({ result }: { result: SearchResult }) {
  return (
    <Link
      href={`/meetings/${result.meetingId}?t=${Math.floor(result.line.start)}`}
      className="block rounded-md p-3 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-base font-bold text-line">{result.speakerName}</span>
        <span className="rounded bg-brand/10 px-1.5 py-0.5 text-sm font-semibold text-brand">
          {formatTimestamp(result.line.start)}
        </span>
      </div>
      <p
        className="mt-1 text-[13px] font-light leading-5 text-fg-1 [&_mark]:rounded-none [&_mark]:bg-brand/20 [&_mark]:text-brand"
        // Safe: `snippet` is built only from this repo's own static seed
        // JSON (see lib/search.ts), never from a runtime request.
        dangerouslySetInnerHTML={{ __html: result.snippet }}
      />
    </Link>
  )
}
