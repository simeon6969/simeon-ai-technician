const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const page = await browser.newPage()
    await page.clock.install()
    let items = [{ notification_id: 1, request_id: 1, item_name: 'Pump', payer: 'client', payer_name: 'Client One', amount: '500', currency: 'RWF', current_percent: '5', submitted_at: '2026-10-01T08:00:00Z', payment_reference: 'PAY-ONE' }]
    let reads = 0, fail = false
    await page.addInitScript(() => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1'); localStorage.setItem('user_role', 'admin') })
    await page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.port === '5199') return route.continue()
      const json = body => route.fulfill({ json: body })
      if (url.pathname === '/users/me') return json({ user_id: 1, full_name: 'Admin', role: 'admin', account_field: 'medical' })
      if (url.pathname === '/admin/payment-reviews') { reads++; return fail ? route.fulfill({ status: 503, json: { detail: 'Unavailable' } }) : json({ total: items.length, items }) }
      if (url.pathname.endsWith('/commission')) return json({ request_id: 1, status: 'pending_review', payer: 'client', is_payer: false, listed_price: '10000', currency: 'RWF', current_percent: '5', amount: '500', minimum_percent: '0', reduction_percent: '0.2', payment_reference: 'PAY-ONE', revision: 3, history: [] })
      if (url.pathname.endsWith('/commission/action')) { items = items.filter(item => item.request_id !== 1); return json({ status: 'approved', history: [], current_percent: '5', seller: { name: 'Seller' } }) }
      if (url.pathname === '/sale-items/public') return json({ total: 0, items: [] })
      return json([])
    })
    await page.goto('http://127.0.0.1:5199/#app')
    const nav = page.getByRole('navigation', { name: 'Workspace navigation' })
    await nav.getByRole('button', { name: /Payment notifications\s*1$/ }).waitFor()
    await nav.getByRole('button', { name: /Payment notifications/ }).click()
    await page.getByRole('button', { name: 'Review this payment', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm payment and unlock', exact: true }).waitFor()
    assert.equal(items.length, 1)
    assert.equal(await page.getByText('PAY-ONE', { exact: false }).count() > 0, true)
    const previousReads = reads
    items = [...items, { ...items[0], notification_id: 2, request_id: 2, item_name: 'Gloves', payment_reference: 'PAY-TWO' }]
    await page.clock.fastForward(30001)
    await nav.getByRole('button', { name: /Payment notifications\s*2$/ }).waitFor()
    assert.ok(reads > previousReads)
    const cards = page.locator('article').filter({ has: page.getByRole('button', { name: 'Review this payment', exact: true }) })
    assert.match(await cards.first().innerText(), /Pump/)
    assert.match(await cards.last().innerText(), /Gloves/)
    fail = true
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.getByRole('alert').filter({ hasText: 'Unable to refresh payment notifications' }).waitFor()
    await nav.getByRole('button', { name: /Payment notifications\s*2$/ }).waitFor()
    fail = false
    await page.getByRole('button', { name: 'Refresh payments', exact: true }).click()
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Confirm payment and unlock', exact: true }).click()
    await nav.getByRole('button', { name: /Payment notifications\s*1$/ }).waitFor()
    assert.equal(items.length, 1)
    await page.reload()
    await nav.getByRole('button', { name: /Payment notifications\s*1$/ }).waitFor()
    console.log('PASS: pending badge, direct review, 30-second refresh, oldest first, retained reminders on failure, resolution and reload persistence')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
