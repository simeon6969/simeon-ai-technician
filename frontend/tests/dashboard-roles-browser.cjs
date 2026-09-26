const assert = require('node:assert/strict');
const { chromium } = require('../../desktop/node_modules/playwright-core');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 try {
  for (const field of ['medical', 'it', 'electrical', 'mechanical']) for (const role of (field === 'medical' ? ['technician', 'store', 'client', 'admin'] : ['technician', 'store', 'client'])) {
   const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
   const errors = []; page.on('pageerror', error => errors.push(error.message));
   await page.addInitScript(role => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1'); localStorage.setItem('user_role', role); }, role);
   await page.route('**/*', route => {
    const url = new URL(route.request().url()); if (url.port === '5199') return route.continue();
    if (url.pathname === '/users/me') return route.fulfill({ json: { user_id: 1, full_name: 'Test account', role, account_field: field, subscription: { plan: 'free', amount: '0', currency: 'RWF', period: 'yearly', payment_status: 'not_required' } } });
    if (url.pathname === '/sale-items/public') return route.fulfill({ json: { items: [], total: 0 } });
    return route.fulfill({ json: [] });
   });
   await page.goto('http://127.0.0.1:5199/#app');
   await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
   assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${field}/${role} mobile overflow`);
   const nav = page.getByRole('navigation');
   if (role === 'admin') { await nav.getByRole('button', { name: /Accounts/ }).click(); await page.getByRole('heading', { name: 'Accounts', exact: true }).waitFor(); assert.deepEqual(errors, []); console.log('PASS admin'); await page.close(); continue; }
   if (role === 'client') assert.equal(await nav.getByRole('button', { name: /Spare parts|Job Cards|Items for sale/i }).count(), 0);
   if (role === 'store') assert.equal(await nav.getByRole('button', { name: /Job Cards|Maintenance/ }).count(), 0);
   await nav.getByRole('button', { name: /Ask Simeon/ }).click();
   await page.getByRole('region', { name: 'Simeon inventory assistant' }).waitFor();
   await nav.getByRole('button', { name: /Requests & marketplace/ }).click();
   await page.getByRole('heading', { name: 'Browse and request items' }).waitFor();
   if (role === 'technician') { await nav.getByRole('button', { name: /My Job Cards/ }).click(); await page.getByRole('button', { name: 'Digital Job Card', exact: true }).waitFor(); }
   assert.deepEqual(errors, []); console.log(`PASS ${field}/${role}`); await page.close();
  }
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
