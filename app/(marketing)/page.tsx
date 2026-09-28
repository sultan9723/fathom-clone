import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, Panel } from '@/components/ui'
import { i18nText } from '@/lib/i18n-text'
import { ActionLink } from '@/components/marketing/action-link'
import { JoinDemo } from '@/components/marketing/join-demo'
import { MeetingStory } from '@/components/marketing/meeting-story'
import { atlas, languages } from '@/components/marketing/demo'
import './landing.css'

export const metadata: Metadata = {
  title: 'Every meeting, understood in every language',
  description: 'Connect your meeting, follow the transcript, and read translations, decisions, and next steps in your own language with NoteAI.',
}

export default function Home() {
  return <div className="landing">
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="landing-header">
      <Link className="wordmark" href="/" aria-label="NoteAI home">NoteAI</Link>
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#languages">Languages</a><a href="#integrations">Integrations</a></nav>
      <div className="header-actions"><ActionLink href="/meetings" secondary>Sign in</ActionLink><ActionLink href="/meetings">Join a meeting</ActionLink></div>
    </header>
    <main id="main">
      <section className="landing-hero" aria-labelledby="hero-heading">
        <Badge>Multilingual meeting notes</Badge>
        <h1 id="hero-heading">Every meeting,<br />understood in<br className="hero-mobile-break" /> every language.</h1>
        <p>Be part of the conversation. NoteAI listens, translates, and brings the decisions and next steps together — in your language.</p>
        <JoinDemo />
        <a className="hero-story-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
      </section>
      <MeetingStory />
      <section className="landing-section" aria-labelledby="everyone-heading">
        <div className="section-intro"><span className="eyebrow">One conversation. Shared context.</span><h2 id="everyone-heading">Everyone reads in<br />their own language.</h2><p>The same idea, at the same moment. No one has to catch up.</p></div>
        <div className="reader-grid">{(['en', 'ur', 'zh'] as const).map((code, i) => {
          const { label, ...presentation } = i18nText(code)
          return <Panel key={code} className="reader-card"><div className="reader-header"><span className={`avatar avatar-${i + 1}`}>{atlas.participants[i][0]}</span><span>{atlas.participants[i]}</span><span {...presentation} className={`${presentation.className} reader-language`}>{label}</span></div><p {...presentation} className={`${presentation.className} reader-quote`}>{atlas.sharedLine[code]}</p>{code !== 'en' && <p className="original" lang="en">{atlas.sharedLine.en}</p>}<span className="reader-source">Ben · Product Atlas Kickoff</span></Panel>
        })}</div>
      </section>
      <section id="languages" className="landing-section" aria-labelledby="languages-heading">
        <div className="section-intro"><span className="eyebrow">Languages</span><h2 id="languages-heading">Your language belongs<br />in the meeting.</h2><p>From the first word to the final notes.</p></div>
        <div className="language-grid">{languages.map(({ code, notes }) => {
          const { label, ...presentation } = i18nText(code)
          return <Panel key={code} className="language-card"><span {...presentation} className={`${presentation.className} language-label`}>{label}</span><p {...presentation}>{notes}</p>{code !== 'en' && <span className="original" lang="en">Meeting notes</span>}</Panel>
        })}</div>
      </section>
      <section id="integrations" className="landing-section integrations-section" aria-labelledby="integrations-heading">
        <div className="section-intro"><span className="eyebrow">Integrations</span><h2 id="integrations-heading">Meet where you<br />already meet.</h2><p>Connect a meeting link, or upload a recording to work from.</p></div>
        <div className="integration-grid">{['Zoom', 'Google Meet', 'Microsoft Teams', 'Upload'].map((name, i) => <Panel key={name} className="integration-card"><h3>{name}</h3><p>{i === 3 ? 'Start with a recording' : 'Start with a meeting link'}</p></Panel>)}</div>
      </section>
      <section className="landing-section privacy-section" aria-labelledby="privacy-heading"><div className="section-intro"><span className="eyebrow">Privacy</span><h2 id="privacy-heading">Clear to everyone.<br />Controlled by you.</h2></div><div className="privacy-list"><div><h3>No invisible notetakers.</h3><p>Everyone sees a recording notice when NoteAI joins.</p></div><div><h3>Your notes. Your audience.</h3><p>You choose who gets the notes.</p></div><div><h3>A meeting can stay in the past.</h3><p>Delete any meeting completely when you no longer need it.</p></div></div></section>
      <section className="landing-section final-cta" aria-labelledby="cta-heading"><h2 id="cta-heading">Bring every voice<br />into the conversation.</h2><p>Your next meeting. Everyone on the same page.</p><ActionLink href="/meetings">Join a meeting <span aria-hidden="true">↗</span></ActionLink></section>
    </main>
    <footer className="landing-footer"><Link className="wordmark" href="/">NoteAI</Link><span>Every voice, understood.</span><nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="https://github.com/sultan9723/fathom-clone">GitHub <span aria-hidden="true">↗</span></a></nav></footer>
  </div>
}
