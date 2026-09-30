import type { Metadata } from 'next'
import { ListVideo } from 'lucide-react'
import { ComingSoon } from '@/components/layout/coming-soon'

export const metadata: Metadata = { title: 'Playlists' }

export default function PlaylistsPage() {
  return (
    <ComingSoon
      icon={ListVideo}
      title="Playlists"
      description="Playlists coming soon. Group related calls together and share a curated list with your team."
    />
  )
}
