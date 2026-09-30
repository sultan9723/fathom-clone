'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, ButtonLink } from '@/components/ui'
import { ScriptText, useReadingLanguage } from '@/components/product/preferences'
import { i18nText } from '@/lib/i18n-text'
import { NavigationDrawer } from './navigation-drawer'
import { AppFooter } from './footer'
import { APP_VERSION } from '@/lib/version'

const navigation = [{ label: 'Meetings', href: '/meetings' }, { label: 'Action items', href: '/action-items' }, { label: 'Settings', href: '/settings' }]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { language } = useReadingLanguage()
  useEffect(() => setOpen(false), [pathname])
  return <aside className="product-sidebar">
    <div className="sidebar-heading"><Link href="/" className="product-wordmark">NoteAI</Link><Button className="mobile-menu-toggle" aria-expanded={open} aria-controls="product-drawer" onClick={() => setOpen(true)}>Menu</Button></div>
    <div id="product-navigation" className="sidebar-content">
      <ButtonLink href="/meetings/new" variant="primary" className="w-full">Add a meeting</ButtonLink>
      <nav aria-label="Product navigation">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <Link href="/settings#profile" className="workspace-profile"><span className="product-avatar" aria-hidden="true">N</span><span>Shared workspace<small>Reads in <ScriptText language={language}>{i18nText(language).label}</ScriptText></small></span></Link>
      {/* DESIGN.md puts the minimal app footer inside the shell, not below
          scrolling content. */}
      <AppFooter />
    </div>
    <NavigationDrawer id="product-drawer" open={open} onClose={() => setOpen(false)} desktopAt={1024} version={APP_VERSION}>
      <ButtonLink href="/meetings/new" variant="primary" className="mb-3 w-full">Add a meeting</ButtonLink>
      <nav aria-label="Mobile product navigation">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}>{item.label}</Link>)}<Link href="/settings#profile">Shared workspace</Link></nav>
    </NavigationDrawer>
  </aside>
}
