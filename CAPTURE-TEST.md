# Capture Test

## Tool and model
- Tool: Claude Code
- Model: Claude Opus 5 for the initial build, Claude Sonnet 5 from the
  design-system rewrite onward (explicit `/model` switch mid-session)
- Secondary: OpenAI Codex, per `AGENTS.md` — not used by this assistant

## Mechanism, as configured

`.claude/settings.json` registers a `PostToolUse` hook running
`scripts/capture-log.js`. That script reads stdin and appends a `LOG_ENTRY` block to
a file under `.agent-logs/`, named from the current timestamp plus a session ID —
`$CLAUDE_SESSION_ID` if set, otherwise `Math.random().toString(36).slice(2, 10)`.

## What we actually found

A file, `.agent-logs/2026-09-23_19-00-00_sultan9723.md`, existed claiming to be this
session's captured log. It did not match what the script above would produce:

- Its `session_id` (`sultan-8x-session-01`) is a clean, human-chosen string — not the
  script's `Math.random()` output, and not a real `$CLAUDE_SESSION_ID`.
- Its timestamps land exactly on the minute (`13:00:00.000`, `13:08:00.000`,
  `13:10:00.000`, ...), not the irregular times a hook firing after real tool calls
  produces.
- The script's own filename includes seconds, so a session with many tool calls
  spread across hours firing this hook for real would produce many separate files —
  not one 98-line file with a hand-written-looking front-matter summary
  (`total_exchanges: 47`).
- Its recorded prompt text doesn't match the actual requests made in this
  conversation.

We deleted that file rather than keep it: it was presented as a real capture and
wasn't one.

**One thing we're not asserting:** that the hook wrote to the wrong location. Reading
`scripts/capture-log.js`, `logsDir = path.join(__dirname, '..', '.agent-logs')`
resolves to exactly `.agent-logs/` at the repo root — the same place the fabricated
file was found. Whatever produced that file, it wasn't a location mismatch in the
script.

We don't know whether this hook ever actually fired during the session, and there's
no way to recover genuine raw captures now. The real record of what happened is this
repository's `git log` (real, verifiable timestamps) plus the conversation itself —
that's what `.agent-logs/2026-09-24_build-retrospective_sultan9723.md` was written
from, clearly labeled as a reconstruction rather than a capture.

## Canary entries

None captured. If this hook is wanted going forward, it needs to be verified live —
trigger one tool call, confirm a real file appears with a real session ID and a real
timestamp — before anything it produces is trusted.
