'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ActionLink } from './action-link'

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  return <header className="landing-header" data-open={open}>
    <Link className="wordmark" href="/" aria-label="NoteAI home">NoteAI</Link><Button className="mobile-menu-toggle" aria-expanded={open} aria-controls="landing-navigation" onClick={() => setOpen(value => !value)}>{open ? 'Close menu' : 'Menu'}</Button>
    <nav id="landing-navigation" aria-label="Main navigation" onClick={() => setOpen(false)}><a href="#how-it-works">How it works</a><a href="#languages">Languages</a><a href="#integrations">Integrations</a></nav>
    <div className="header-actions"><ActionLink href="/sign-in" secondary>Sign in</ActionLink><ActionLink href="/meetings/new">Import a transcript</ActionLink></div>
  </header>
}
