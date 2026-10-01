const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true })
 try {
  let branding = { name: 'S', logo: null }
  const page = await browser.newPage()
  await page.addInitScript(() => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1') })
  await page.route('**/*', route => {
   const u = new URL(route.request().url()); if (u.port === '5199') return route.continue()
   const json = body => route.fulfill({ json: body })
   if (u.pathname === '/app-branding') return json(branding)
   if (u.pathname === '/admin/app-branding') { branding = route.request().postDataJSON(); return json(branding) }
   if (u.pathname === '/users/me') return json({ user_id: 1, full_name: 'Admin', role: 'admin', account_field: 'medical', subscription: { plan: 'free', amount: '0', currency: 'RWF', period: 'yearly', payment_status: 'not_required' } })
   if (['/admin/payment-reviews', '/my/commission-approvals', '/sale-items/public'].includes(u.pathname)) return json({ total: 0, items: [] })
   return json([])
  })
  await page.goto('http://127.0.0.1:5199/#app')
  await page.getByRole('navigation').getByRole('button', { name: /App branding/ }).click()
  await page.getByLabel('App name', { exact: true }).fill('Nova Care')
  await page.getByLabel('App logo', { exact: true }).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHhQAAAAASUVORK5CYII=', 'base64') })
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await page.getByText('Branding saved.', { exact: true }).waitFor()
  assert.equal(await page.title(), 'Nova Care')
  await page.goto('http://127.0.0.1:5199/#home')
  await page.getByText('Nova Care brings engineers or technicians', { exact: false }).waitFor()
  assert.ok(await page.getByRole('img', { name: 'Nova Care', exact: true }).count())
  await page.reload()
  await page.getByText('Nova Care brings engineers or technicians', { exact: false }).waitFor()
  console.log('PASS: admin name/logo save, public homepage branding and reload persistence')
 } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
