'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ActionLink } from './action-link'
import { NavigationDrawer } from '@/components/layout/navigation-drawer'

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  return <header className="landing-header" data-open={open}>
    <Link className="wordmark" href="/" aria-label="NoteAI home">NoteAI</Link><Button className="mobile-menu-toggle" aria-expanded={open} aria-controls="landing-drawer" onClick={() => setOpen(true)}>Menu</Button>
    <nav id="landing-navigation" aria-label="Main navigation" onClick={() => setOpen(false)}><a href="#how-it-works">How it works</a><a href="#languages">Languages</a><a href="#integrations">Integrations</a></nav>
    <div className="header-actions"><ActionLink href="/sign-in" secondary>Sign in</ActionLink><ActionLink href="/meetings/new">Import a transcript</ActionLink></div>
    <NavigationDrawer id="landing-drawer" open={open} onClose={() => setOpen(false)} desktopAt={768}>
      <nav aria-label="Mobile navigation"><a href="#how-it-works">How it works</a><a href="#languages">Languages</a><a href="#integrations">Coming soon</a><Link href="/sign-in">Sign in</Link><Link href="/meetings/new">Import a transcript</Link></nav>
    </NavigationDrawer>
  </header>
}
