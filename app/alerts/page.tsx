import type { Metadata } from 'next'
import { BellRing } from 'lucide-react'
import { ComingSoon } from '@/components/layout/coming-soon'

export const metadata: Metadata = { title: 'Alerts' }

export default function AlertsPage() {
  return (
    <ComingSoon
      icon={BellRing}
      title="Alerts"
      description="Alerts coming soon. Get notified when a keyword, competitor, or objection comes up in a call."
    />
  )
}
