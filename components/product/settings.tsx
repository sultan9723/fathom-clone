'use client'

import { Panel } from '@/components/ui'
import { productRequest } from '@/lib/product-api'
import { LanguageSelect, useReadingLanguage } from './preferences'
import { Notice, LoadingState } from './states'
import { useResource } from './use-resource'

export function Settings() {
  const { language, setLanguage, saved } = useReadingLanguage()
  const connection = useResource(signal => productRequest<{ status: string }>('/health', { signal }), 'health')
  return <div className="product-page"><header className="product-page-header"><div><h1>Settings</h1><p>Your reading preferences and workspace capabilities.</p></div></header>
    <Panel className="product-section" as="section"><h2>Read in your language</h2><p>This preference applies to transcripts, summaries and action items. It is saved on this browser, not to an account.</p><LanguageSelect value={language} onChange={setLanguage} />{!saved && <p role="status" className="product-caption">Browser storage is unavailable. This preference applies for this visit.</p>}</Panel>
    <Panel className="product-section" as="section"><h2 id="profile">Shared workspace</h2><p>Account sign-in and individual profiles are not configured. This workspace does not provide private accounts or per-person sharing controls.</p></Panel>
    <Panel className="product-section" as="section"><h2>Connection</h2>{connection.loading ? <LoadingState label="Checking connection" onCancel={connection.cancel} /> : connection.error || connection.canceled ? <Notice title={connection.canceled ? 'Connection check canceled' : 'Could not reach the workspace'} warning={!!connection.error} onRetry={connection.retry}>{connection.error}</Notice> : <p role="status">Meeting service is connected.</p>}</Panel>
    <Panel className="product-section" as="section"><h2>Integrations</h2><dl className="capability-list">{['Zoom', 'Google Meet', 'Microsoft Teams', 'Audio / video upload', 'Live transcription'].map(name => <div key={name}><dt>{name}</dt><dd>Not available</dd></div>)}<div><dt>Translation, summaries and Q&amp;A</dt><dd>Available when the workspace’s AI service responds. Availability is checked when you use it.</dd></div><div><dt>Meeting and action-item storage</dt><dd>{connection.data && !connection.error && !connection.canceled ? 'Meeting service connected; stored records are checked when loaded.' : 'Connection not verified.'}</dd></div></dl></Panel>
  </div>
}
