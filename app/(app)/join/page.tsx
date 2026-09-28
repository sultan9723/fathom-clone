import Link from 'next/link'
import { JoinForm } from '@/components/product/join-form'
import { Panel } from '@/components/ui'

export default function JoinPage() {
  return <div className="product-page"><header className="product-page-header"><div><h1>Join a meeting</h1><p>A meeting link connects the conversation. Everyone should know when it is recorded.</p></div></header><JoinForm /><Panel className="product-section"><h2>Clear to everyone in the call.</h2><p>When live joining is available, NoteAI must appear as a participant and show a recording notice to everyone. Live recording, waiting-room admission and stop-recording controls are not connected in this workspace.</p><Link className="product-text-link" href="/meetings/new">Already have the transcript? Import it</Link></Panel></div>
}
