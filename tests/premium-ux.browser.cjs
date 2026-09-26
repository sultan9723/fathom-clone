// Run against `next start` with Playwright installed, or set PLAYWRIGHT_MODULE
// to a temporary Playwright installation. All API traffic is mocked locally.
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PREMIUM_CHROMIUM_PATH })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    const base = process.env.PREMIUM_TEST_URL || 'http://localhost:3100'
    const meeting = {
      id: 'premium-test', title: 'Product review', description: 'Weekly planning with the product team.',
      languages: 'en,es', speaker_count: 4, duration_seconds: 1440, created_at: '2026-09-26T10:00:00Z',
    }
    let failList = false
    let failSearch = false
    let failTranscript = false
    let listDelay = 700
    let transcriptDelay = 1500
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/transcripts')) {
        await new Promise((resolve) => setTimeout(resolve, transcriptDelay))
        return route.fulfill({ status: failTranscript ? 503 : 200, json: [] })
      }
      if (path.endsWith('/action-items')) return route.fulfill({ json: [] })
      if (path.endsWith('/ai/ask')) {
        return route.fulfill({ json: { response: 'AI unavailable: AuthenticationError private-diagnostic' } })
      }
      if (path.endsWith('/search')) return route.fulfill({ status: failSearch ? 503 : 200, json: [meeting] })
      if (path.endsWith('/meetings')) {
        await new Promise((resolve) => setTimeout(resolve, listDelay))
        return route.fulfill({ status: failList ? 503 : 200, json: [meeting] })
      }
      return route.fulfill({ json: meeting })
    })

    await page.goto(`${base}/meetings`)
    await page.getByRole('status', { name: 'Loading meetings', exact: true }).waitFor()
    await page.getByRole('link', { name: /Product review/ }).waitFor()
    listDelay = 0
    failList = true
    await page.reload()
    await page.getByRole('heading', { name: 'We couldn’t load your meetings', exact: true }).waitFor()
    failList = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await page.getByRole('link', { name: /Product review/ }).waitFor()
    failSearch = true
    await page.getByRole('searchbox', { name: 'Search meetings', exact: true }).fill('review')
    await page.getByRole('heading', { name: 'We couldn’t load your meetings', exact: true }).waitFor()
    assert.equal(await page.getByText('No meetings found', { exact: true }).count(), 0)
    failSearch = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await page.getByRole('link', { name: /Product review/ }).waitFor()

    await page.goto(`${base}/meetings/premium-test?q=review`)
    await page.getByRole('status', { name: 'Loading transcript', exact: true }).waitFor()
    await page.getByText('No transcript yet', { exact: true }).waitFor()
    await page.getByRole('tab', { name: 'Action Items' }).click()
    await page.getByText('No action items assigned', { exact: true }).waitFor()
    await page.getByText('Recording available for premium members', { exact: true }).waitFor()
    assert.equal(await page.locator('iframe').count(), 0)

    await page.getByRole('button', { name: 'Play demo playback', exact: true }).first().click()
    await page.waitForFunction(() => Number(document.querySelector('input[type="range"]').value) > 0)
    await page.getByRole('button', { name: 'Pause demo playback', exact: true }).first().click()
    const seek = page.getByRole('slider', { name: 'Seek demo playback' })
    await seek.focus()
    await seek.press('End')
    assert.equal(await seek.inputValue(), '1440')
    await page.getByRole('button', { name: 'Restart demo playback' }).click()
    assert.equal(await seek.inputValue(), '0')

    await page.getByRole('tab', { name: 'Summary', exact: true }).click()
    await page.getByRole('button', { name: 'Generate summary' }).click()
    await page.getByText('Could not reach the assistant. Please try again.', { exact: true }).waitFor()
    assert.equal(await page.getByText(/private-diagnostic/).count(), 0)
    await page.getByRole('button', { name: 'Generate summary' }).waitFor()

    failTranscript = true
    transcriptDelay = 0
    await page.goto(`${base}/meetings/premium-test?q=review`)
    await page.getByRole('heading', { name: 'We couldn’t load the transcript', exact: true }).waitFor()
    await page.getByRole('heading', { name: 'Product review', exact: true }).waitFor()
    failTranscript = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await page.getByText('No transcript yet', { exact: true }).waitFor()
    assert.equal(await page.getByRole('tab', { name: 'Transcript', exact: true }).getAttribute('aria-selected'), 'true')

    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}px`)
      await page.getByRole('button', { name: 'Play demo playback', exact: true }).first().waitFor()
      if (process.env.PREMIUM_SCREENSHOT_DIR && (width === 375 || width === 1440)) {
        await page.screenshot({ path: `${process.env.PREMIUM_SCREENSHOT_DIR}/premium-${width}.png`, fullPage: true })
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.getByRole('status').first().evaluate((node) => getComputedStyle(node).animationName), 'none')
    assert.deepEqual(errors, [], 'No unhandled browser exceptions')
    console.log('Premium UX browser checks passed: loading, empty states, retries, AI fallback, demo playback, four viewports, reduced motion.')
  } finally {
    await browser.close()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
