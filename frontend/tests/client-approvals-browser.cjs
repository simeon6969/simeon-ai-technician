const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true })
 try {
  const page = await browser.newPage(); await page.clock.install()
  let approved = false, reads = 0, requests = 0
  await page.addInitScript(() => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1'); localStorage.setItem('user_role', 'client') })
  await page.route('**/*', route => {
   const u = new URL(route.request().url()); if (u.port === '5199') return route.continue()
   const json = body => route.fulfill({ json: body })
   if (u.pathname === '/users/me') return json({ user_id: 1, full_name: 'Client', role: 'client', account_field: 'medical', subscription: { plan: 'free', amount: '0', currency: 'RWF', period: 'yearly', payment_status: 'not_required' } })
   if (u.pathname === '/my/commission-approvals') { reads++; return json({ total: approved ? 1 : 0, items: approved ? [{ request_id: 10, item_name: 'Pump', approved_at: '2026-10-01T10:00:00Z' }] : [] }) }
   if (u.pathname.endsWith('/commission')) return json({ status: 'approved', current_percent: '5', amount: '500', currency: 'RWF', payer: 'client', history: [], seller: { name: 'Approved Seller', phone: '+250788123456' } })
   if (u.pathname === '/sale-items/public') return json({ total: 0, items: [] })
   if (u.pathname === '/item-requests/') { requests++; return json([]) }
   return json([])
  })
  await page.goto('http://127.0.0.1:5199/#app')
  await page.getByText('Approvals will appear here after admin confirms payment.', { exact: true }).waitFor()
  approved = true; await page.clock.fastForward(30001)
  await page.getByText(/Admin approved your requests/).waitFor()
  const previous = reads
  await page.getByRole('button', { name: 'Refresh approvals', exact: true }).click()
  await page.getByRole('button', { name: /Approval notifications.*1/ }).click()
  await page.getByRole('button', { name: 'View unlocked seller contacts', exact: true }).click()
  await page.getByText('Approved Seller', { exact: true }).waitFor(); assert.ok(reads > previous)
  await page.getByRole('navigation').getByRole('button', { name: /Requests & marketplace/ }).click()
  const refresh = page.getByRole('button', { name: 'Refresh requests', exact: true })
  await refresh.waitFor(); await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent.includes('Refresh requests')).disabled)
  const oldRequests = requests; await refresh.click()
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent.includes('Refresh requests')).disabled)
  assert.ok(requests > oldRequests)
  await page.reload(); await page.getByText(/Admin approved your requests/).waitFor()
  console.log('PASS: client auto-notification, manual refresh, unlocked contact link, request refresh, and reload persistence')
 } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
