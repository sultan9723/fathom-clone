'use client'

import { MeetingLoadError } from '@/components/meeting-list/premium-feedback'

export default function MeetingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 py-10 sm:px-6">
      <MeetingLoadError title="This page needs another try" onRetry={reset} />
    </div>
  )
}
