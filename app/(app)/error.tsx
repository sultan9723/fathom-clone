'use client'
import Link from 'next/link'
import { Notice } from '@/components/product/states'
export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Notice title="This page needs another try" warning onRetry={reset}><p>Your saved meetings are still stored in the workspace.</p><Link className="product-text-link" href="/meetings">Back to meetings</Link></Notice>
}
