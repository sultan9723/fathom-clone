import Link from 'next/link'
import { Panel } from '@/components/ui'
import '@/components/product/product.css'

export default function SignInPage() {
  return <main className="product-sign-in"><Link className="product-wordmark" href="/">NoteAI</Link><Panel className="product-section"><h1>Sign-in isn’t configured</h1><p>This version uses a shared workspace. Individual accounts and private sharing are not available yet.</p><Link className="product-link-button primary" href="/meetings">Open shared workspace</Link><Link className="product-text-link" href="/">Back to NoteAI</Link></Panel></main>
}
