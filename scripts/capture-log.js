const fs = require('fs')
const path = require('path')

const logsDir = path.join(__dirname, '..', '.agent-logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const now = new Date()
const sessionId = process.env.CLAUDE_SESSION_ID || Math.random().toString(36).slice(2, 10)
const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-').replace('--', '_')
const logFile = path.join(logsDir, dateStr + '_' + sessionId + '.md')

let input = ''
process.stdin.on('data', chunk => { input += chunk })
process.stdin.on('end', () => {
  const entry = '[LOG_ENTRY type=RESPONSE session=' + sessionId + ']
timestamp: ' + now.toISOString() + '
model: claude-sonnet-4-6

' + input + '

---
'
  fs.appendFileSync(logFile, entry)
})