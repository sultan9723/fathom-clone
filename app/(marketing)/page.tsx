import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, Panel } from '@/components/ui'
import { i18nText } from '@/lib/i18n-text'
import { ActionLink } from '@/components/marketing/action-link'
import { JoinDemo } from '@/components/marketing/join-demo'
import { JoinForm } from '@/components/product/join-form'
import { MeetingStory } from '@/components/marketing/meeting-story'
import { atlas, languages } from '@/components/marketing/demo'
import './landing.css'
import '@/components/product/product.css'

export const metadata: Metadata = {
  title: 'Every meeting, understood in every language',
  description: 'Import a meeting transcript and read translations, summaries, decisions, and next steps in your own language with NoteAI.',
}

export default function Home() {
  return <div className="landing">
    <a href="#main" className="skip-link">Skip to content</a>
    <div id="main">
      <section className="landing-hero" aria-labelledby="hero-heading">
        <Badge>Multilingual meeting notes</Badge>
        <h1 id="hero-heading">Every meeting,<br />understood in<br className="hero-mobile-break" /> every language.</h1>
        <p>Be part of the conversation. Turn meeting transcripts into translations, decisions and next steps — in your language.</p>
        <div className="hero-import"><ActionLink href="/meetings/new">Import a transcript <span aria-hidden="true">↗</span></ActionLink><ActionLink href="/meetings" secondary>Explore meetings</ActionLink></div>
        <p className="hero-import-help">Paste your transcript with speaker names and timestamps. Then translate, summarize, and ask questions.</p>
        <a className="hero-story-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
      </section>
      <MeetingStory />
      <section className="landing-section" aria-labelledby="everyone-heading">
        <div className="section-intro"><span className="eyebrow">One conversation. Shared context.</span><h2 id="everyone-heading">Everyone reads in<br />their own language.</h2><p>The same idea, at the same moment. No one has to catch up.</p></div>
        <div className="reader-grid">{(['en', 'ur', 'zh'] as const).map((code, i) => {
          const { label, ...presentation } = i18nText(code)
          return <Panel key={code} className="reader-card"><div className="reader-header"><span className={`avatar avatar-${i + 1}`}>{atlas.participants[i][0]}</span><span>{atlas.participants[i]}</span><span {...presentation} className={`${presentation.className} reader-language`}>{label}</span></div><p {...presentation} className={`${presentation.className} reader-quote`}>{atlas.sharedLine[code]}</p>{code !== 'en' && <p className="original" lang="en">{atlas.sharedLine.en}</p>}<span className="reader-source">Ayesha · Product Atlas Kickoff · example</span></Panel>
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
        <div className="section-intro"><Badge>Coming soon</Badge><h2 id="integrations-heading">Meeting connections<br />and recording uploads.</h2><p>Zoom, Google Meet, Microsoft Teams, and recording uploads are previews. Today, start by importing an existing transcript.</p></div>
        <div className="integration-grid">{['Zoom', 'Google Meet', 'Microsoft Teams', 'Upload'].map(name => <Panel key={name} className="integration-card"><h3>{name}</h3><p>Not connected</p></Panel>)}</div>
        <details className="join-example"><summary>Preview the joining experience — illustrative demo</summary><p>This preview cannot join a call or upload a recording.</p><JoinForm /><JoinDemo /></details>
      </section>
      <section className="landing-section privacy-section" aria-labelledby="privacy-heading"><div className="section-intro"><span className="eyebrow">Privacy</span><h2 id="privacy-heading">Clear to everyone.<br />Controlled by you.</h2></div><div className="privacy-list"><div><h3>No invisible notetakers.</h3><p>The joining experience requires a visible recording notice for everyone. Live recording is not connected here.</p></div><div><h3>Your notes. Your audience.</h3><p>Choose what to copy or export. This shared workspace does not yet offer private accounts or recipient access controls.</p></div><div><h3>A meeting can stay in the past.</h3><p>Delete a meeting and its saved transcript, translations and action items when you no longer need them.</p></div></div></section>
      <section className="landing-section final-cta" aria-labelledby="cta-heading"><h2 id="cta-heading">Bring every voice<br />into the conversation.</h2><p>Start with a transcript. Share the understanding.</p><ActionLink href="/meetings/new">Import a transcript <span aria-hidden="true">↗</span></ActionLink></section>
    </div>
  </div>
}
