import { CircleCheck, Gavel } from 'lucide-react'
import type { Meeting } from '@/lib/types'

export function SummaryPanel({ summary }: { summary: Meeting['summary'] }) {
  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Summary
      </h2>

      <p className="text-[15px] font-light leading-6 text-fg-1">{summary.overview}</p>

      <h3 className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-3">
        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Key points
      </h3>
      <ul className="mt-2 space-y-2">
        {summary.keyPoints.map((point, i) => (
          <li key={i} className="flex gap-2.5 text-sm font-light leading-relaxed text-fg-2">
            <span
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
              aria-hidden="true"
            />
            {point}
          </li>
        ))}
      </ul>

      {summary.decisions && summary.decisions.length > 0 && (
        <>
          <h3 className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-3">
            <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
            Decisions
          </h3>
          <ul className="mt-2 space-y-2">
            {summary.decisions.map((decision, i) => (
              <li
                key={i}
                className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-light leading-relaxed text-fg-1"
              >
                {decision}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
