'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

/** Parse first, sanitize last. No untrusted HTML reaches the DOM. */
export function Markdown({ text, ...props }: {
  text: string
  className?: string
  dir?: 'ltr' | 'rtl'
  lang?: string
}) {
  const [rendered, setRendered] = useState({ source: '', html: '' })
  useEffect(() => {
    const html = DOMPurify.sanitize(marked.parse(text, { async: false }), {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'title'],
    })
    setRendered({ source: text, html })
  }, [text])

  return <div {...props} className={`markdown-content ${props.className ?? ''}`}
    dangerouslySetInnerHTML={{ __html: rendered.source === text ? rendered.html : '' }} />
}
