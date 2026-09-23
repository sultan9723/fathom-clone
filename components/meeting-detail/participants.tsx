import { Users } from 'lucide-react'
import type { Participant, TranscriptLine } from '@/lib/types'
import { Avatar } from '@/components/ui/avatar'

export function Participants({
  participants,
  transcript,
}: {
  participants: Participant[]
  transcript: TranscriptLine[]
}) {
  // Share of speaking time — a cheap, genuinely useful signal from data we
  // already have, and the reason the panel is worth more than a list of names.
  const spoken = new Map<string, number>()
  let total = 0
  for (const line of transcript) {
    const secs = Math.max(0, line.end - line.start)
    spoken.set(line.speakerId, (spoken.get(line.speakerId) ?? 0) + secs)
    total += secs
  }

  return (
    <section aria-labelledby="participants-heading" className="mt-6">
      <h3
        id="participants-heading"
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-3"
      >
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        Participants
        <span className="font-normal normal-case text-fg-4">({participants.length})</span>
      </h3>

      <ul className="mt-2 space-y-3">
        {participants.map((p) => {
          const share = total > 0 ? ((spoken.get(p.id) ?? 0) / total) * 100 : 0
          return (
            <li key={p.id} className="flex items-center gap-3">
              <Avatar participant={p} size="lg" className="ring-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg-1">{p.name}</p>
                {p.email && <p className="truncate text-xs text-fg-3">{p.email}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  <div
                    className="h-1 flex-1 overflow-hidden rounded-full bg-surface-4"
                    role="img"
                    aria-label={`${p.name} spoke for ${Math.round(share)}% of the meeting`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${share}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-fg-3">
                    {Math.round(share)}%
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
