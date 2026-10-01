const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true })
 try {
  const requests = []; let delay = false
  const page = await browser.newPage()
  await page.addInitScript(() => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1') })
  await page.route('**/*', async route => {
   const u = new URL(route.request().url()); if (u.port === '5199') return route.continue()
   requests.push(u.pathname + u.search)
   const json = body => route.fulfill({ json: body })
   if (u.pathname === '/app-branding') return json({ name: 'S', logo: null })
   if (u.pathname === '/users/me') return json({ user_id: 1, full_name: 'Admin', role: 'admin', account_field: 'medical', subscription: { plan: 'free', amount: '0', currency: 'RWF', period: 'yearly', payment_status: 'not_required' } })
   if (u.pathname === '/admin/overview-counts') return json({ users: 30, 'job-cards': 0, 'sale-items': 0, 'item-requests': 0, awaiting_setup: 0, fields: {}, roles: {} })
   if (u.pathname === '/admin/records/users') {
    if (delay) await new Promise(resolve => setTimeout(resolve, 500))
    const start = Number(u.searchParams.get('offset'))
    return json({ total: 30, items: Array.from({ length: start ? 5 : 25 }, (_, i) => ({ user_id: start+i+1, full_name: `Account ${start+i+1}`, role: 'admin', owner: { full_name: `Account ${start+i+1}`, role: 'admin' } })) })
   }
   if (['/admin/payment-reviews', '/my/commission-approvals', '/sale-items/public'].includes(u.pathname)) return json({ total: 0, items: [] })
   return json([])
  })
  await page.goto('http://127.0.0.1:5199/#app')
  await page.getByRole('button', { name: 'Accounts 30', exact: true }).waitFor()
  assert.equal(requests.filter(url => url.startsWith('/admin/records/')).length, 0)
  assert.ok(!requests.includes('/admin/users'))
  await page.getByRole('navigation').getByRole('button', { name: /Accounts/ }).click()
  await page.getByRole('heading', { name: 'Account 1', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('heading', { name: 'Account 26', exact: true }).waitFor()
  delay = true
  await page.getByRole('button', { name: 'Refresh section', exact: true }).click()
  assert.ok(await page.getByRole('heading', { name: 'Account 26', exact: true }).isVisible())
  await page.getByRole('button', { name: 'Refresh section', exact: true }).waitFor()
  await page.getByLabel('Search records', { exact: true }).fill('Needle')
  await page.waitForResponse(response => response.url().includes('search=Needle'))
  assert.ok(requests.some(url => url.includes('offset=0') && url.includes('search=Needle')))
  console.log('PASS: count-only overview, lazy section loading, pagination, retained refresh results, debounced server search')
 } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
