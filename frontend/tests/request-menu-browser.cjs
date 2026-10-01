const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true })
 try {
  let posts = 0, commissionReads = 0
  const page = await browser.newPage()
  await page.addInitScript(() => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1') })
  await page.route('**/*', route => {
   const u = new URL(route.request().url()); if (u.port === '5199') return route.continue()
   const json = body => route.fulfill({ json: body })
   if (u.pathname === '/app-branding') return json({ name: 'S', logo: null })
   if (u.pathname === '/sale-items/public') return json({ total: 1, items: [{ listing_key: 'sale-1', item_type: 'sale', item_id: 1, name: 'Test pump', description: 'Pump', price: '1000', currency: 'RWF', account_field: 'medical' }] })
   if (u.pathname === '/item-requests/') { posts++; return json({ request_id: 7, status: 'pending' }) }
   if (u.pathname === '/item-requests/7/commission') {
    commissionReads++
    return json({ status: 'not_started', enabled: true })
   }
   return json([])
  })
  await page.goto('http://127.0.0.1:5199/#home')
  const card = page.locator('article').filter({ hasText: 'Test pump' })
  await card.getByRole('button', { name: 'Request', exact: true }).click()
  assert.equal(posts, 0)
  await card.getByRole('button', { name: 'Request to seller', exact: true }).click()
  await card.getByText('Request saved', { exact: true }).waitFor()
  assert.equal(posts, 1); assert.equal(commissionReads, 0)
  await card.getByRole('button', { name: 'Request', exact: true }).click()
  await card.getByRole('button', { name: 'Request seller info', exact: true }).click()
  await card.getByRole('button', { name: 'Start negotiation', exact: true }).waitFor()
  assert.equal(posts, 1); assert.ok(commissionReads >= 1)
  assert.ok(await card.getByText('Seller contacts stay locked until admin confirms the commission payment.', { exact: true }).isVisible())
  console.log('PASS: request menu saves once, reuses request for seller-info negotiation, and retains contact lock')
 } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
