'use client'
import { Notice } from '@/components/product/states'
export default function MeetingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Notice title="This page needs another try" warning onRetry={reset}>Your saved meetings are still stored in the workspace.</Notice>
}
