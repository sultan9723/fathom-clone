import type { Metadata } from 'next'
import { Handshake } from 'lucide-react'
import { ComingSoon } from '@/components/layout/coming-soon'

export const metadata: Metadata = { title: 'Deals' }

export default function DealsPage() {
  return (
    <ComingSoon
      icon={Handshake}
      title="Deals"
      description="Deals coming soon. Link calls to CRM opportunities and track what was discussed at each stage."
    />
  )
}
