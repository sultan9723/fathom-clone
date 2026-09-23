# Instructions for Claude Code

Follow SPEC.md — it is the single source of truth.

## Your ownership
- app/layout.tsx, app/page.tsx
- app/meetings/[id]/
- components/meeting-detail/
- lib/ai/
- lib/transcript.ts
- app/api/ask/route.ts

## Rules
- Run npm run build before marking any task done
- Never touch components/meeting-list/ or data/
- Keep API key server-side only
- Use PlayerProvider context for all time state
