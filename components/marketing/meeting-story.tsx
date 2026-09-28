'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Panel } from '@/components/ui'
import { i18nText } from '@/lib/i18n-text'
import { duration, stagger, translateTiming, useReducedMotion } from '@/lib/motion'
import { atlas, steps, storyPosition } from './demo'

function useDemoTime(enabled: boolean) {
  const [time, setTime] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const start = performance.now()
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - start
      setTime(elapsed)
      if (elapsed > 10000) window.clearInterval(timer)
    }, stagger.tight)
    return () => window.clearInterval(timer)
  }, [enabled])
  return time
}

function Stream({ text, time, start }: { text: string; time: number; start: number }) {
  const words = text.split(' ')
  const count = Math.max(0, Math.floor((time - start) / stagger.tight))
  return <span className="stream-text">
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">{words.map((word, i) => <span key={i} style={{ opacity: i < count ? 1 : 0 }}>{word} </span>)}</span>
  </span>
}

function Translation({ index, time }: { index: number; time: number }) {
  const line = atlas.translations[index]
  const { label, ...presentation } = i18nText(line.code)
  const progress = Math.max(0, Math.min(1, (time - index * translateTiming.lineStagger) / translateTiming.lineDuration))
  const alphabet = line.code === 'ur' ? 'ابپتجدرسم' : line.code === 'zh' ? '会议范围开发' : 'reunión'
  const text = Array.from(line.text).map((char, i, all) => {
    if (char === ' ' || i < all.length * progress) return char
    return alphabet[(i + Math.floor(time / stagger.tight)) % alphabet.length]
  }).join('')
  return <div className="translation-line">
    <span {...presentation} className={`${presentation.className} language-label`}>{label}</span>
    <p {...presentation}><span className="sr-only">{line.text}</span><span aria-hidden="true">{text}</span></p>
    <p className="original" lang="en">{atlas.lines[line.sourceIndex].text}</p>
  </div>
}

function StoryVisual({ step, animate, onJump }: { step: number; animate: boolean; onJump: () => void }) {
  const reduced = useReducedMotion()
  const time = useDemoTime(animate && !reduced)
  const elapsed = reduced || !animate ? Number.POSITIVE_INFINITY : time
  return <Panel className="story-panel">
    <div className="story-panel-header"><div><span className="eyebrow">Example meeting</span><h4>{atlas.title}</h4></div><Badge variant="live">Listening</Badge></div>
    {step === 0 && <div className="connect-visual">
      <div className="connected-link"><span className="mono">meet.google.com/xqb-rmtn-kfe</span><Badge variant="live">Joined</Badge></div>
      <div className="participants">{atlas.participants.map((name, i) => <div className="participant" key={name}><span className={`avatar avatar-${i + 1}`}>{name.slice(0, 1)}</span><span>{name}</span></div>)}<div className="participant"><span className="avatar">N</span><span>NoteAI</span><Badge variant="live">Listening</Badge></div></div>
      <p className="recording-notice">NoteAI is recording and transcribing this meeting. This notice is visible to everyone.</p>
    </div>}
    {step === 1 && <div className="transcript-lines">{atlas.lines.map((line, i) => <div className="transcript-line" key={line.time}><div className="line-meta"><span>{line.speaker}</span><time>{line.time}</time></div><p><Stream text={line.text} time={elapsed} start={i * 1900} /></p></div>)}<span className="listening-caption"><span className="typing-caret" aria-hidden="true">|</span> Listening for the next word</span></div>}
    {step === 2 && <div className="translations">{atlas.translations.map((line, i) => <Translation key={line.code} index={i} time={elapsed} />)}</div>}
    {step === 3 && <div className="understand-visual">{atlas.insights.map((insight, i) => {
      const line = atlas.lines[insight.source]
      const shown = elapsed >= i * (duration.slow + stagger.loose)
      return <div key={line.time} className={`source-pair ${shown ? 'source-pair-visible' : ''}`}>
        <blockquote><span className="line-meta">{line.speaker} · {line.time}</span>{line.text}</blockquote>
        <div className="summary-item" style={{ opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(12px)' }}><span className="eyebrow">{insight.kind}</span><p>{insight.text}</p></div>
      </div>
    })}</div>}
    {step === 4 && <div className="ask-visual"><div className="question"><span className="eyebrow">You asked</span><p>{atlas.question}</p></div><span className="eyebrow">NoteAI</span><p {...i18nTextProps('ur')}>{atlas.answerUrdu}</p><p className="original" lang="en">{atlas.answer}</p><Button variant="secondary" onClick={onJump}>Jump to {atlas.lines[3].time} <span aria-hidden="true">↗</span></Button><p className="source-disclosure">Example source · Who reviews the FAQ</p></div>}
  </Panel>
}

function i18nTextProps(code: string) {
  const { lang, dir, className } = i18nText(code)
  return { lang, dir, className }
}

export function MeetingStory() {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [position, setPosition] = useState(0)
  const [active, setActive] = useState(0)
  const [desktop, setDesktop] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const source = useRef<HTMLDivElement>(null)
  const sourceTrigger = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px) and (min-height: 760px)')
    const update = () => setDesktop(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!desktop || reduced) return
    let frame = 0
    const update = () => {
      frame = 0
      if (!root.current) return
      const box = root.current.getBoundingClientRect()
      const next = storyPosition(box.top, box.height, window.innerHeight)
      setActive(previous => previous === next.step ? previous : next.step)
      setPosition(next.position)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [desktop, reduced])

  const pinned = desktop && !reduced
  function selectStep(index: number) {
    if (!root.current) return
    const box = root.current.getBoundingClientRect()
    const y = window.scrollY + box.top + (box.height - window.innerHeight) * (index + 0.15) / steps.length
    window.scrollTo({ top: y, behavior: 'instant' })
    setActive(index)
    setPosition(index + 0.15)
  }
  function jump() {
    sourceTrigger.current = document.activeElement as HTMLElement | null
    setSourceOpen(true)
    requestAnimationFrame(() => {
      source.current?.focus()
      source.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    })
  }
  return <section id="how-it-works" className="landing-section story-section" aria-labelledby="story-heading">
    <div className="section-intro"><span className="eyebrow">How it works · Example workflow</span><h2 id="story-heading">From a meeting link<br />to a decision.</h2><p>Connect → Listen → Translate → Understand → Ask</p><p className="product-caption">An illustrative meeting, not a live call. Joining and recording services are not connected in this workspace.</p></div>
    <div ref={root} className={`story-track ${pinned ? 'is-pinned' : ''}`}>
      <div className="story-stage">
        {pinned ? <>
          <nav className="step-list" aria-label="Meeting demo steps">{steps.map((step, i) => <button type="button" key={step.title} onClick={() => selectStep(i)} aria-pressed={active === i} aria-controls="active-story-visual"><span className="step-number">0{i + 1}</span><span className="step-copy"><strong>{step.title}</strong><span>{step.description}</span><span className="step-progress" role="progressbar" aria-label={`${step.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, Math.max(0, position - i)) * 100)}><span style={{ transform: `scaleX(${Math.min(1, Math.max(0, position - i))})` }} /></span></span></button>)}</nav>
          <div id="active-story-visual" className="active-story-visual" aria-label={`${steps[active].title} example`}><StoryVisual key={active} step={active} animate onJump={jump} /></div>
        </> : <div className="stacked-steps">{steps.map((step, i) => <article key={step.title} id={`step-${i}`}><div className="stacked-step-heading"><span className="step-number">0{i + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></div><StoryVisual step={i} animate={false} onJump={jump} /></article>)}</div>}
      </div>
    </div>
    {sourceOpen && <div ref={source} tabIndex={-1} className="source-preview" role="region" aria-label="FAQ review source"><div><span className="eyebrow">Example source · {atlas.title}</span><p>Ming · {atlas.lines[3].time}</p><blockquote>{atlas.lines[3].text}</blockquote></div><Button onClick={() => { setSourceOpen(false); sourceTrigger.current?.focus() }}>Close source</Button></div>}
  </section>
}
