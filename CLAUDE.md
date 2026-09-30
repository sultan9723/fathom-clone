# Instructions for Claude Code

Follow SPEC.md — it is the single source of truth.

## Your ownership
- app/layout.tsx
- app/(app)/ and app/(marketing)/ layouts
- app/(app)/meetings/ and app/(app)/meetings/[id]/
- components/meeting-detail/, components/meetings/, components/ui/
- lib/ (api, api-base, i18n-text, motion, scramble, design-tokens)
- backend/

Codex owns app/(marketing)/page.tsx, components/marketing/ and
components/product/.

## Rules
- Run npm run build before marking any task done
- Keep API keys server-side only. The browser never holds one: AI and
  translation go through the FastAPI backend, which reads the key from its
  own environment.
- Meeting data comes from the backend API only. There is no seed or demo
  content in the app — demo content belongs on the marketing page alone.
