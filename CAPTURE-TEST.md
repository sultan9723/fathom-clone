# Capture Test

## Tool and Model
- Tool: Claude Code
- Model: claude-sonnet-4-6
- Secondary: OpenAI Codex

## Mechanism
Claude Code PostToolUse hook in .claude/settings.json
Script: scripts/capture-log.js
Appends response to .agent-logs/ on every turn

## Log file path
.agent-logs/

## Canary entries
[filled after canary test passes]