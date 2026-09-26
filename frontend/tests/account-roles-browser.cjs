// Start Vite on port 5199; run: node frontend/tests/account-roles-browser.cjs
const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    for (const role of ['technician', 'store', 'client', 'organization']) {
      const context = await browser.newContext()
      const page = await context.newPage()
      let account = { user_id: 9001, full_name: 'Test account', role, account_field: role === 'organization' ? null : 'it' }
      let submitted = false
      await page.addInitScript(account => {
        localStorage.setItem('access_token', 'mock-token')
        localStorage.setItem('user_id', String(account.user_id))
        localStorage.setItem('user_role', account.role)
      }, account)
      await page.route('**/*', async route => {
        const url = new URL(route.request().url())
        if (url.port === '5199') return route.continue()
        const json = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
        if (url.pathname === '/users/me') return json(account)
        if (url.pathname === '/users/account-setup') { account = { ...account, ...route.request().postDataJSON() }; return json(account) }
        if (url.pathname === '/sale-items/public') return json({ total: 1, items: [{ listing_key: 'sale-1', item_id: 1, item_type: 'sale', seller_name: 'Seller', account_field: 'medical', name: 'Test analyzer', price: '100', currency: 'USD', description: 'Posted item' }] })
        if (url.pathname === '/item-requests/' && route.request().method() === 'POST') { submitted = true; return json({ request_id: 1, status: 'pending' }) }
        return json([])
      })
      await page.goto('http://localhost:5199/#app')
      if (role === 'organization') {
        await page.getByLabel('Account field', { exact: true }).selectOption('electrical')
        await page.getByLabel('Account role', { exact: true }).selectOption('client')
        await page.getByRole('button', { name: 'Continue', exact: true }).click()
        await page.getByRole('heading', { name: 'Browse and request items' }).waitFor()
        assert.equal(account.role, 'client')
        assert.equal(account.account_field, 'electrical')
      } else if (role === 'technician') {
        await page.getByRole('heading', { name: 'My Job Cards', exact: true }).waitFor()
        assert.equal(await page.getByRole('button', { name: /Get Maintenance or Spare-Part Help/ }).count(), 1)
      } else {
        await page.getByRole('heading', { name: 'Browse and request items' }).waitFor()
        assert.equal(await page.getByRole('heading', { name: 'My Job Cards', exact: true }).count(), 0)
        assert.equal(await page.getByRole('button', { name: /Maintenance Help/ }).count(), 0)
        assert.equal(await page.getByRole('button', { name: 'Store Spare Part', exact: true }).count(), role === 'store' ? 1 : 0)
      }
      await page.getByRole('button', { name: 'Request item', exact: true }).click()
      await page.getByText('Request saved', { exact: true }).waitFor()
      assert.ok(submitted)
      if (role === 'store') {
        await page.getByRole('button', { name: 'Store Spare Part', exact: true }).click()
        await page.getByRole('textbox', { name: 'Part Name', exact: true }).waitFor()
        assert.equal(await page.getByRole('textbox', { name: 'Submitter name', exact: true }).count(), 0)
      }
      await context.close()
    }
    console.log('PASS: technician, store, client, legacy setup, and item request screens')
  } finally { await browser.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
