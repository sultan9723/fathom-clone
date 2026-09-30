// Run with next start on :3100 and the real FastAPI app on :8013.
// Isolated backend: GROQ_DAILY_CALL_BUDGET=0, RATE_LIMIT_AI=1/hour,
// RATE_LIMIT_TRANSLATIONS=1/hour, GROQ_API_KEY=local-test-never-sent.
// The zero budget rejects before any provider call. Use a disposable database.
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const fs = require('node:fs')
const base = process.env.V3_TEST_URL || 'http://localhost:3100'
const api = process.env.V3_API_URL || 'http://localhost:8013/api/v1'
const artifacts = '.agent-logs/v3-verification'

async function main() {
  fs.mkdirSync(artifacts, { recursive: true })
  const browser = await chromium.launch({ headless: true,
    ...(process.env.V3_CHROMIUM_PATH ? { executablePath: process.env.V3_CHROMIUM_PATH } : {}) })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page must fit viewport')
  const shot = name => page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true })
  try {
    const meetings = await (await fetch(`${api}/meetings`)).json()
    assert.equal(meetings.length, 3)
    for (const meeting of meetings) {
      const lines = await (await fetch(`${api}/meetings/${meeting.id}/transcripts`)).json()
      assert.equal(new Set(lines.map(line => line.speaker_name)).size, meeting.speaker_count)
      assert(lines.length >= 25)
      assert(lines.every(line => line.speaker_name && line.speaker_name !== 'Unknown'))
      assert(lines.at(-1).timestamp_seconds > meeting.duration_seconds * .9)
    }
    console.log('Real database API: 3 unique demos; 28/32/36 named transcript turns spanning 20/30/45 minutes.')

    await page.goto(`${base}/meetings`)
    await page.getByRole('link', { name: 'Product Atlas Kickoff', exact: true }).waitFor()
    await page.setViewportSize({ width: 375, height: 812 })
    const cards = page.getByRole('list', { name: 'Meetings', exact: true })
    await cards.waitFor()
    assert.equal(await cards.locator('li').count(), 3)
    for (const card of await cards.locator('li').all()) {
      assert.equal(await card.locator('dd').count(), 2)
      const bounds = await card.boundingBox()
      assert(bounds.x >= 0 && bounds.x + bounds.width <= 375)
      assert((await card.locator('a').boundingBox()).height <= 48, 'demo title uses at most two lines')
    }
    assert.equal(await page.locator('table:visible').count(), 0)
    const search = page.getByRole('searchbox', { name: 'Search meetings', exact: true })
    const searchBox = await search.boundingBox()
    const filters = await page.getByRole('group', { name: 'Filter meetings by date' }).boundingBox()
    assert(filters.y >= searchBox.y + searchBox.height)
    assert(searchBox.width >= 320)
    await noOverflow()
    await shot('meetings-375')
    await search.fill('atlas')
    await page.waitForTimeout(200)
    assert.equal(await cards.locator('li').count(), 1)
    await search.fill('engineering')
    await page.getByRole('button', { name: 'Clear search', exact: true }).click()
    assert.equal(await cards.locator('li').count(), 3)
    await page.waitForTimeout(250)
    assert.equal(await cards.locator('li').count(), 3, 'pending debounce cannot undo clear')
    await search.fill('no-such-meeting')
    await page.waitForTimeout(200)
    assert.equal(await cards.count(), 0)
    await search.fill('')
    assert.equal(await cards.locator('li').count(), 3, 'native clear resets results')
    console.log('375px meetings: cards, title/date/duration, full-width search, pills below, no overflow; rapid typing/clear passed.')

    async function drawerCheck() {
      const heading = page.locator('main h1').first()
      const before = await heading.boundingBox()
      const menu = page.getByRole('button', { name: 'Menu', exact: true })
      await menu.click()
      const drawer = page.getByRole('dialog', { name: 'Navigation menu' })
      await drawer.waitFor()
      await page.waitForTimeout(230)
      const after = await heading.boundingBox()
      assert.equal(after.y, before.y, 'menu must not shift content')
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
      assert.equal(await drawer.evaluate(node => getComputedStyle(node).transitionDuration), '0.2s')
      const close = drawer.getByRole('button', { name: 'Close menu' })
      await close.focus()
      await page.keyboard.press('Shift+Tab')
      assert(await drawer.evaluate(node => node.contains(document.activeElement)))
      await page.keyboard.press('Tab')
      assert(await close.evaluate(node => node === document.activeElement))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(240)
      assert.equal(await drawer.isVisible(), false)
      assert(await menu.evaluate(node => node === document.activeElement))
      await menu.click()
      await page.waitForTimeout(230)
      await page.mouse.click(5, 100)
      await page.waitForTimeout(240)
      assert.equal(await drawer.isVisible(), false)
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
    }
    await drawerCheck()

    const meeting = meetings.find(item => item.title === 'Product Atlas Kickoff')
    const lines = await (await fetch(`${api}/meetings/${meeting.id}/transcripts`)).json()
    await page.goto(`${base}/meetings/${meeting.id}`)
    await page.getByRole('heading', { name: 'Transcript', exact: true }).waitFor()
    const tabs = page.getByRole('group', { name: 'Read the transcript in' })
    const heading = await page.getByRole('heading', { name: 'Transcript', exact: true }).boundingBox()
    assert((await tabs.boundingBox()).y >= heading.y + heading.height)
    for (const button of await tabs.getByRole('button').all()) {
      const rect = await button.boundingBox()
      assert(rect.width >= 44 && rect.height >= 44)
      assert.equal(await button.evaluate(node => getComputedStyle(node).whiteSpace), 'nowrap')
    }
    const bars = page.locator('[data-speaker-bar]')
    assert.equal(await bars.count(), meeting.speaker_count)
    const widths = await bars.evaluateAll(nodes => nodes.map(node => parseFloat(node.style.width)))
    assert(Math.abs(widths.reduce((a,b) => a+b,0) - 100) < .01)
    assert.equal(new Set(await bars.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor))).size, 3)
    await noOverflow()
    await shot('transcript-375')
    await page.screenshot({ path: `${artifacts}/transcript-top-375.png` })

    // Markdown fixtures exercise the browser DOM, sanitizer, languages, and regeneration.
    // Only successful provider responses are fixtures; 429/503 below use real backend enforcement.
    let answer = '**Key Points**\n\n- *Product Atlas* ships in six weeks.\n\n<script>window.xss=1</script><img src=x onerror="window.xss=1"><a href="javascript:alert(1)">unsafe</a>'
    await page.route('**/api/v1/ai/ask', route => route.fulfill({ json: { response: answer } }))
    let translatedLanguage = 'ur'
    await page.route('**/translations?*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2600))
      await route.fulfill({ json: { meeting_id: meeting.id, cached: false, lang: translatedLanguage,
        lines: lines.map(line => ({ line_id: line.id, text: 'Translated example' })) } })
    })
    const summary = page.getByRole('region', { name: 'Summary', exact: true })
    await summary.getByRole('button', { name: 'Summarize', exact: true }).click()
    await summary.locator('strong').waitFor()
    assert.equal(await summary.locator('em').textContent(), 'Product Atlas')
    assert.equal(await summary.locator('script,img,[onerror],a[href^="javascript:"]').count(), 0)
    assert.equal(await page.evaluate(() => window.xss), undefined)
    assert.equal(await summary.locator('[aria-live="polite"]').count(), 1)
    answer = '**Updated**\n\n*Confirmed*'
    await summary.getByRole('button', { name: 'Regenerate' }).click()
    await summary.getByRole('button', { name: 'Regenerate' }).waitFor()
    await summary.locator('strong').filter({ hasText: 'Updated' }).waitFor()
    const ask = page.getByRole('region', { name: 'Ask', exact: true })
    await ask.getByRole('textbox', { name: 'Ask about this meeting' }).fill('What was decided?')
    await ask.getByRole('button', { name: 'Ask', exact: true }).click()
    await ask.locator('.markdown-content[lang="en"] strong').waitFor()
    for (const [label, code, text] of [['اردو','ur','**اہم نکات**\n\n*منصوبہ*'],['中文','zh','**关键要点**\n\n*项目*'],['ES','es','**Puntos clave**\n\n*Proyecto*']]) {
      translatedLanguage = code
      await tabs.getByRole('button', { name: label, exact: true }).click()
      assert.equal(await tabs.getByRole('button', { name: label, exact: true }).getAttribute('aria-busy'), 'true')
      await page.waitForTimeout(300)
      assert.equal(await tabs.getByRole('button', { name: label, exact: true }).getAttribute('aria-busy'), 'true')
      await page.waitForFunction(() => !document.querySelector('.language-tabs [aria-busy="true"]'))
      answer = text
      await summary.getByRole('button', { name: 'Summarize', exact: true }).click()
      const tag = code === 'zh' ? 'zh-Hans' : code
      await page.waitForFunction(tag => document.querySelector('.markdown-content[lang="'+tag+'"] strong'), tag)
      await ask.getByRole('textbox', { name: 'Ask about this meeting' }).fill('What was decided?')
      await ask.getByRole('button', { name: 'Ask', exact: true }).click()
      await ask.locator(`.markdown-content[lang="${tag}"] strong`).waitFor()
      assert.equal(await summary.locator('.markdown-content').getAttribute('dir'), code === 'ur' ? 'rtl' : 'ltr')
    }
    console.log('375px transcript: separate language row, 44×44 targets, nonwrapping Chinese, proportional colored speaker bars. 2.6s cache-miss loading dot verified.')
    console.log('Browser Markdown: English/Urdu/Chinese/Spanish, Summary/Regenerate/Ask; unsafe scripts/images/javascript URLs removed; polite live regions and RTL retained.')

    await page.unroute('**/api/v1/ai/ask')
    await page.unroute('**/translations?*')
    await page.goto(`${base}/meetings/${meeting.id}`)
    await summary.getByRole('button', { name: 'Summarize', exact: true }).waitFor()
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': `v3-summary-${Date.now()}` })
    for (const status of [503, 429]) {
      const response = page.waitForResponse(r => r.url().endsWith('/ai/ask') && r.status() === status)
      await summary.getByRole('button', { name: 'Summarize', exact: true }).click()
      const res = await response
      const body = await res.json()
      await summary.getByRole('alert').filter({ hasText: status === 503 ? 'available again tomorrow' : 'wait a moment' }).waitFor()
      console.log(`REAL backend Summary ${status}: ${body.detail}; UI: ${await summary.getByRole('alert').textContent()}`)
    }
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': `v3-ask-${Date.now()}` })
    for (const status of [503, 429]) {
      await ask.getByRole('textbox', { name: 'Ask about this meeting' }).fill('What was decided?')
      const response = page.waitForResponse(r => r.url().endsWith('/ai/ask') && r.status() === status)
      await ask.getByRole('button', { name: 'Ask', exact: true }).click()
      await response
      await ask.getByRole('alert').filter({ hasText: status === 503 ? 'available again tomorrow' : 'wait a moment' }).waitFor()
      console.log(`REAL backend Ask ${status}: friendly message displayed.`)
    }
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': `v3-translation-${Date.now()}` })
    for (const [label, status] of [['اردو',503],['中文',429]]) {
      const response = page.waitForResponse(r => r.url().includes('/translations?') && r.status() === status)
      await tabs.getByRole('button', { name: label, exact: true }).click()
      await response
      await page.getByRole('alert').filter({ hasText: status === 503 ? 'available again tomorrow' : 'wait a moment' }).last().waitFor()
      console.log(`REAL backend Translation ${status}: friendly message displayed; original transcript retained.`)
    }
    await shot('real-limit-messages-375')

    await page.goto(base)
    await page.getByRole('heading', { level: 1 }).waitFor()
    assert.equal(await page.locator('.landing-hero input').count(), 0)
    assert(await page.locator('.landing-hero').getByRole('link', { name: /Import a transcript/ }).isVisible())
    assert(await page.locator('#integrations').getByText('Coming soon', { exact: true }).isVisible())
    await noOverflow()
    await shot('homepage-375')
    await page.screenshot({ path: `${artifacts}/hero-375.png` })
    await drawerCheck()
    await page.getByText('Preview the joining experience — illustrative demo', { exact: true }).click()
    const previewInput = page.getByRole('textbox', { name: 'Meeting link', exact: true })
    assert(!(await previewInput.evaluate(node => getComputedStyle(node).fontFamily)).includes('Mono'))
    for (const width of [639, 640, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await noOverflow()
    }
    console.log('Homepage: import-first hero, prominent Coming soon preview, body-font input. Both navigation drawers overlay, trap/restore focus, close on backdrop/Escape, and lock scroll.')
    assert.deepEqual(errors, [])
    console.log('PASS: v3 browser regression suite; no unhandled browser exceptions.')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
