import type { Meeting } from '@/lib/types'
import { NotesContent } from './notes-content'

/** Persistent right column, lg+ only — hidden below that, where the
 * Details tab (see SubNavTabs / MeetingDetail) covers the same content. */
export function NotesColumn({ meeting }: { meeting: Meeting }) {
  return (
    <aside className="hidden w-notes-col shrink-0 px-4 pb-8 pt-5 lg:block">
      <NotesContent meeting={meeting} />
    </aside>
  )
}
