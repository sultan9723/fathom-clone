import type { Meeting } from '@/lib/types'
import { SummaryPanel } from './summary-panel'
import { Highlights } from './highlights'
import { Participants } from './participants'

/**
 * SPEC's Summary tab describes a decorative AI-template-picker grid — this
 * app has no template-switching feature, so that's skipped in favor of the
 * real precomputed summary. Highlights and Participants have no other slot
 * in the new tab/Notes-column structure but are still required components,
 * so they're folded in here rather than dropped.
 */
export function SummaryTab({ meeting }: { meeting: Meeting }) {
  return (
    <div className="bg-page p-5">
      <SummaryPanel summary={meeting.summary} />
      <Highlights highlights={meeting.highlights} />
      <Participants participants={meeting.participants} transcript={meeting.transcript} />
    </div>
  )
}
