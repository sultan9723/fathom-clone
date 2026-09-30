import type { ApiMeeting } from './types'

/** Literal, case-insensitive metadata search; no regex or server result state. */
export function filterMeetings(meetings: ApiMeeting[], query: string): ApiMeeting[] {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return meetings
  return meetings.filter(meeting =>
    [meeting.title, meeting.description, meeting.languages].some(value =>
      value?.toLocaleLowerCase().includes(needle)))
}
