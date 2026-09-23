import { FileText, CircleCheck, Gavel } from 'lucide-react'
import type { Meeting } from '@/lib/types'

export function SummaryPanel({ summary }: { summary: Meeting['summary'] }) {
  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2
        id="summary-heading"
        className="flex items-center gap-2 text-sm font-semibold text-slate-900"
      >
        <FileText className="h-4 w-4 text-indigo-600" aria-hidden="true" />
        Summary
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">{summary.overview}</p>

      <h3 className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Key points
      </h3>
      <ul className="mt-2 space-y-2">
        {summary.keyPoints.map((point, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
            <span
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400"
              aria-hidden="true"
            />
            {point}
          </li>
        ))}
      </ul>

      {summary.decisions && summary.decisions.length > 0 && (
        <>
          <h3 className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
            Decisions
          </h3>
          <ul className="mt-2 space-y-2">
            {summary.decisions.map((decision, i) => (
              <li
                key={i}
                className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm leading-relaxed text-emerald-900"
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
