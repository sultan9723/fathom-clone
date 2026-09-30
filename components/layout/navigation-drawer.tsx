'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import './navigation-drawer.css'

/**
 * The slide-in mobile menu (DESIGN.md).
 *
 * Native <dialog showModal> makes the rest of the page inert, which is a
 * stronger focus trap than a hand-rolled one; the explicit Tab wrapping below
 * is belt-and-braces for links. Escape, click-outside, focus return to the
 * opener, scroll lock and auto-close on reaching desktop are all handled here
 * so no caller has to remember them.
 */

/**
 * Must match --drawer-duration in globals.css. The close is delayed by this
 * long so the panel finishes sliding out before <dialog> is removed from the
 * top layer — otherwise it vanishes mid-animation.
 */
const DRAWER_DURATION_MS = 260

export function NavigationDrawer({ open, onClose, id, desktopAt, version, children }: {
  open: boolean
  onClose: () => void
  id: string
  desktopAt: number
  /** Shown pinned to the bottom of the panel, matching the app footer. */
  version?: string
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const media = matchMedia(`(min-width: ${desktopAt}px)`)
    const resize = () => { if (media.matches) onCloseRef.current() }
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [desktopAt])

  useEffect(() => {
    const node = dialog.current!
    if (!open) {
      node.dataset.entered = 'false'
      const timer = setTimeout(() => {
        node.close()
        opener.current?.focus()
      }, DRAWER_DURATION_MS)
      return () => clearTimeout(timer)
    }
    opener.current = document.activeElement as HTMLElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    node.showModal()
    // Establish the off-screen starting position before the enter transition.
    node.getBoundingClientRect()
    close.current?.focus()
    const frame = requestAnimationFrame(() => { node.dataset.entered = 'true' })
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = overflow
    }
  }, [open])

  return <dialog ref={dialog} id={id} className="navigation-drawer" aria-label="Navigation menu"
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return
      const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]'))
      const first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }}>
    <div className="drawer-heading"><span>Menu</span><button ref={close} type="button" onClick={onClose} aria-label="Close menu"><X aria-hidden="true" size={24} /></button></div>
    <div className="drawer-links" onClick={event => { if ((event.target as HTMLElement).closest('a')) onClose() }}>
      {children}
      {version && <span className="drawer-version">NoteAI · {version}</span>}
    </div>
  </dialog>
}
