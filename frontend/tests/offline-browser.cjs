// Run with the Vite dev server on 5199 and desktop dependencies installed:
// node frontend/tests/offline-browser.cjs
const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext()
    const page = await context.newPage()
    async function waitUntil(check) {
      const deadline = Date.now() + 15000
      while (!await page.evaluate(check)) {
        if (Date.now() > deadline) throw new Error('Timed out waiting for saved queue state')
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    let offline = true
    let failAfterSave = false
    let responseStatus = 200
    let requests = 0
    const receipts = new Map()
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'isolated-test-token')
      localStorage.setItem('user_id', '9001')
      localStorage.setItem('user_role', 'technician')
      localStorage.setItem('offline-profile:9001', JSON.stringify({ user_id: 9001, full_name: 'Offline Tester', role: 'technician' }))
      window.testOffline = true
      Object.defineProperty(navigator, 'onLine', { get: () => !window.testOffline })
    })
    await page.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.port === '5199') return route.continue()
      if (offline) return route.abort()
      const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) })
      if (url.pathname === '/offline/submit') {
        requests++
        const body = route.request().postDataJSON()
        if (responseStatus !== 200) return route.fulfill({ status: responseStatus, contentType: 'application/json', body: '{}' })
        if (!receipts.has(body.submission_id)) receipts.set(body.submission_id, { kind: body.kind, record_id: receipts.size + 100 })
        if (failAfterSave) { failAfterSave = false; return route.abort() }
        return json(receipts.get(body.submission_id))
      }
      if (url.pathname === '/users/me') return json({ user_id: 9001, full_name: 'Offline Tester', role: 'technician' })
      return json([])
    })
    await page.goto('http://localhost:5199/#app')
    const openPart = async () => {
      await page.getByRole('button', { name: /Store a Job Card or Spare Part/ }).click()
      await page.getByRole('button', { name: /Store information about an available spare part/ }).click()
    }
    await openPart()
    await page.getByRole('textbox', { name: 'Part Name', exact: true }).fill('Offline pump')
    await page.getByRole('button', { name: 'Send reply', exact: true }).click()
    await page.getByRole('textbox', { name: 'Asking price', exact: true }).fill('123.45')
    await waitUntil(async () => (await (await import('/src/offlineStore.js')).readDraft(9001, 'part'))?.draft === '123.45')
    await page.reload()
    await openPart()
    assert.equal(await page.getByRole('textbox', { name: 'Asking price', exact: true }).inputValue(), '123.45')
    await page.getByRole('button', { name: 'Send reply', exact: true }).click()
    await page.getByRole('button', { name: 'RWF', exact: true }).click()
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Skip for now', exact: true }).click()
    await page.getByRole('button', { name: 'available', exact: true }).click()
    for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Skip for now', exact: true }).click()
    await page.locator('input[type=file]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=', 'base64') })
    await page.getByRole('button', { name: 'Save Spare Part', exact: true }).click()
    await waitUntil(async () => (await (await import('/src/offlineStore.js')).listQueue(9001)).length === 1)
    const queued = await page.evaluate(async () => (await (await import('/src/offlineStore.js')).listQueue(9001))[0])
    assert.equal(queued.payload.part.price, '123.45')
    assert.ok(queued.payload.part.photo_data.startsWith('data:image/png;base64,'))
    assert.equal(requests, 0)
    assert.equal(await page.evaluate(async () => (await (await import('/src/offlineStore.js')).listQueue(9002)).length), 0)
    await page.reload()
    await page.getByText('Waiting to sync', { exact: false }).waitFor()
    offline = false
    failAfterSave = true
    await page.evaluate(() => { window.testOffline = false; window.dispatchEvent(new Event('online')) })
    await waitUntil(async () => (await (await import('/src/offlineStore.js')).listQueue(9001))[0]?.error === 'network')
    await page.getByRole('button', { name: 'Sync now', exact: true }).click()
    await waitUntil(async () => (await (await import('/src/offlineStore.js')).listQueue(9001))[0]?.status === 'synced')
    assert.equal(receipts.size, 1)
    assert.ok(requests >= 2, `Expected retry, saw ${requests} requests`)
    // New queued records stop on expired credentials, then retry the same ID.
    const queueAnother = () => page.evaluate(async () => {
      const store = await import('/src/offlineStore.js')
      await store.queueDraft(9001, 'part', { kind: 'part', submission_id: crypto.randomUUID(), part: { part_name: 'Second pump' } })
    })
    await queueAnother()
    responseStatus = 401
    await page.evaluate(async () => (await import('/src/offlineSync.js')).syncQueue(9001))
    assert.equal(await page.evaluate(async () => (await (await import('/src/offlineStore.js')).listQueue(9001))[1].error), 'auth')
    responseStatus = 200
    await page.evaluate(async () => (await import('/src/offlineSync.js')).syncQueue(9001))
    assert.equal(receipts.size, 2)
    console.log('PASS: offline profile, draft/text/photo restore, durable queue, account isolation, reconnect, lost-response retry, expired credentials')
    await context.close()
  } finally { await browser.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
