# Instructions for Codex

Follow SPEC.md — it is the single source of truth.

## Your ownership
- data/meetings/*.json
- lib/repository.ts
- app/meetings/page.tsx
- components/meeting-list/
- components/share/
- tests/

## Rules
- Never touch components/meeting-detail/ or lib/ai/
- Run npm run build before marking any task done
- Match types exactly from lib/types.ts
- Generate realistic transcripts: 3-6 speakers, 20-60 min meetings
