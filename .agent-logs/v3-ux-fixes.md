# v3 UX fixes — session log

Base: fetched `origin/main`, verified `fd232dbe07125259b179f8d2e0e335512527c3eb`.
Started with a clean checkout; created `v3-ux-fixes`. No changes on main.
The explicit task authorizes the necessary edits beyond the older AGENTS.md ownership list.
No PR, merge, deployment, or production database mutation is authorized in this session.

## 1 — Markdown

Shared marked → DOMPurify renderer, restricted to document markup and safe link attributes.
Summary, Regenerate, and Ask preserve language/direction and use persistent polite live regions.
Render sanitization runs in the browser, keeping server rendering independent of a simulated DOM.
Reference: https://marked.js.org/ and https://github.com/cure53/DOMPurify.
Verification results and remaining issue notes follow as work completes.
