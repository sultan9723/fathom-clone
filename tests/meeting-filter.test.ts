import { describe, expect, it } from 'vitest'
import { filterMeetings } from '../lib/meeting-filter'
import type { ApiMeeting } from '../lib/types'

const meetings: ApiMeeting[] = [
  { id: 'a', title: 'Product Atlas', description: 'Map planning', languages: 'en', speaker_count: 3, duration_seconds: 1200, created_at: '' },
  { id: 'b', title: 'خلاصہ 中文', description: null, languages: null, speaker_count: 3, duration_seconds: 1200, created_at: '' },
]
describe('meeting filters', () => {
  it('matches titles and descriptions case-insensitively', () => {
    expect(filterMeetings(meetings, ' ATLAS ')).toEqual([meetings[0]])
    expect(filterMeetings(meetings, 'planning')).toEqual([meetings[0]])
  })
  it('handles multilingual names and literal punctuation', () => {
    expect(filterMeetings(meetings, '中文')).toEqual([meetings[1]])
    expect(filterMeetings(meetings, '.*')).toEqual([])
  })
  it('clearing restores the original dataset without mutation', () => {
    filterMeetings(meetings, 'Atlas')
    expect(filterMeetings(meetings, '')).toBe(meetings)
    expect(filterMeetings(meetings, '   ')).toHaveLength(2)
  })
})
