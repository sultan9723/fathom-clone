import type { ReactNode } from 'react'
import { Button, Panel, StatusDot } from '@/components/ui'

export function LoadingState({ label, onCancel }: { label: string; onCancel?: () => void }) {
  return <div className="product-loading" role="status" aria-label={label} aria-busy="true"><p>{label}…</p><div aria-hidden="true" className="skeleton-lines"><span /><span /><span /></div>{onCancel && <Button onClick={onCancel}>Cancel</Button>}</div>
}

export function Notice({ title, children, onRetry, onCancel, warning = false }: { title: string; children?: ReactNode; onRetry?: () => void; onCancel?: () => void; warning?: boolean }) {
  return <div className={`product-notice ${warning ? 'notice-warning' : ''}`} role={warning ? 'alert' : 'status'}><h3>{title}</h3>{children && <div className="notice-copy">{children}</div>}{(onRetry || onCancel) && <div className="product-actions">{onRetry && <Button onClick={onRetry}>Try again</Button>}{onCancel && <Button onClick={onCancel}>Cancel</Button>}</div>}</div>
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <Panel className="product-empty"><h2>{title}</h2><p>{children}</p>{action && <div className="product-actions">{action}</div>}</Panel>
}

/** Render only from a real provider/job state. Current backend has neither. */
export type WorkflowState =
  | { kind: 'waiting'; platform: string; link: string }
  | { kind: 'join-failed'; reason: string }
  | { kind: 'processing'; filename: string; stage: 'received' | 'transcribing' | 'translating'; progress?: number }

export function WorkflowStatus({ state, onCancel, onRetry }: { state: WorkflowState; onCancel: () => void; onRetry: () => void }) {
  if (state.kind === 'waiting') return <Notice title="Waiting to be let in" onCancel={onCancel}><p><StatusDot /> NoteAI is in the {state.platform} waiting room. Ask the host to admit “NoteAI Notetaker”.</p><p className="mono wrap-anywhere">{state.link}</p></Notice>
  if (state.kind === 'join-failed') return <Notice title="NoteAI couldn’t join this meeting" warning onRetry={onRetry} onCancel={onCancel}><p>{state.reason}</p></Notice>
  return <Notice title={`Processing “${state.filename}”`} onCancel={onCancel}><p>{state.stage === 'received' ? 'Audio received' : state.stage === 'transcribing' ? 'Transcribing speakers…' : 'Translating and summarizing…'}</p><div className="product-progress" role="progressbar" aria-label="Recording processing" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.progress}><span style={{ transform: `scaleX(${Math.max(0, Math.min(100, state.progress ?? 0)) / 100})` }} /></div></Notice>
}
