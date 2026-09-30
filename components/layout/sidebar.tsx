'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { ScriptText, useReadingLanguage } from '@/components/product/preferences'
import { i18nText } from '@/lib/i18n-text'
import { NavigationDrawer } from './navigation-drawer'

const navigation = [{ label: 'Meetings', href: '/meetings' }, { label: 'Action items', href: '/action-items' }, { label: 'Settings', href: '/settings' }]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { language } = useReadingLanguage()
  useEffect(() => setOpen(false), [pathname])
  return <aside className="product-sidebar">
    <div className="sidebar-heading"><Link href="/" className="product-wordmark">NoteAI</Link><Button className="mobile-menu-toggle" aria-expanded={open} aria-controls="product-drawer" onClick={() => setOpen(true)}>Menu</Button></div>
    <div id="product-navigation" className="sidebar-content">
      <Link href="/join" className="product-link-button primary">Add a meeting</Link>
      <nav aria-label="Product navigation">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <Link href="/settings#profile" className="workspace-profile"><span className="product-avatar" aria-hidden="true">N</span><span>Shared workspace<small>Reads in <ScriptText language={language}>{i18nText(language).label}</ScriptText></small></span></Link>
    </div>
    <NavigationDrawer id="product-drawer" open={open} onClose={() => setOpen(false)} desktopAt={1024}>
      <Link href="/meetings/new" className="product-link-button primary">Import a transcript</Link>
      <nav aria-label="Mobile product navigation">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <Link href="/settings#profile">Shared workspace</Link>
    </NavigationDrawer>
  </aside>
}
