import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMeetingRepository } from '@/lib/repository'
import { MeetingDetail } from '@/components/meeting-detail/meeting-detail'

type Params = { id: string }
type Search = { t?: string }

export async function generateStaticParams(): Promise<Params[]> {
  const ids = await getMeetingRepository().listIds()
  return ids.map((id) => ({ id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { id } = await params
  const meeting = await getMeetingRepository().getById(id)
  if (!meeting) return { title: 'Meeting not found' }
  return {
    title: `${meeting.title} · Fathom Clone`,
    description: meeting.summary.overview.slice(0, 160),
  }
}

export default async function MeetingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const [{ id }, { t }] = await Promise.all([params, searchParams])

  const meeting = await getMeetingRepository().getById(id)
  if (!meeting) notFound()

  // ?t= comes from a shared link; ignore anything that is not a sane number.
  const parsed = Number(t)
  const initialTime =
    t !== undefined && Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, meeting.durationSec)
      : 0

  return <MeetingDetail meeting={meeting} initialTime={initialTime} />
}
