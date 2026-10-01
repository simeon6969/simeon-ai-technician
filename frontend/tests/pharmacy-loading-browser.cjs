const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true })
 try {
  let blocked = false
  const page = await browser.newPage()
  await page.addInitScript(() => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1') })
  await page.route('**/*', route => {
   const u = new URL(route.request().url()); if (u.port === '5199') return route.continue()
   const json = body => route.fulfill({ json: body })
   if (u.pathname === '/app-branding') return json({ name: 'S', logo: null })
   if (u.pathname === '/users/me') return json({ user_id: 1, full_name: 'Medical Store', role: 'store', account_field: 'medical', subscription: { plan: 'free', amount: '0', currency: 'RWF', period: 'yearly', payment_status: 'not_required' } })
   if (u.pathname === '/sale-items/my') return blocked ? route.fulfill({ status: 403, json: { detail: 'This function is not available for your account role' } }) : json([{ item_id: 1, name: 'Stored medicine', price: 100, currency: 'RWF', medical_category: 'pharmacy', medical_details: { quantity: 10, unit: 'box', generic_name: 'Medicine', dosage_form: 'Tablet' } }])
   if (u.pathname === '/item-requests/') return route.fulfill({ status: 503, json: { detail: 'Requests unavailable' } })
   if (u.pathname === '/sale-items/public') return json({ items: [], total: 0 })
   return json([])
  })
  await page.goto('http://127.0.0.1:5199/#app')
  await page.getByRole('navigation').getByRole('button', { name: /05.*Pharmacy/ }).click()
  await page.getByRole('heading', { name: 'Stored medicine', exact: true }).waitFor()
  assert.ok(await page.getByRole('button', { name: 'Update stock details', exact: true }).isVisible())
  blocked = true
  await page.getByRole('button', { name: 'Refresh', exact: true }).first().click()
  await page.getByRole('alert').filter({ hasText: 'This function is not available for your account role' }).first().waitFor()
  console.log('PASS: stored pharmacy medicines load despite request-service failure; permission reason is shown')
 } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
