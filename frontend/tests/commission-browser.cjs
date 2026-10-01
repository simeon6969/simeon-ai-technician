const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const page = await browser.newPage()
    let state = { status: 'not_started', enabled: true, request_id: 1 }
    let settings = { enabled: true, payer: 'client', starting_percent: '5', minimum_percent: '0', reduction_percent: '0.2', momo_number: '0786854200' }
    let admin = false
    const actions = []
    await page.addInitScript(() => { localStorage.setItem('access_token', 'mock'); localStorage.setItem('user_id', '1'); localStorage.setItem('user_role', window.location.hash === '#app' ? 'admin' : 'client') })
    await page.route('**/*', async route => {
      const u = new URL(route.request().url())
      if (u.port === '5199') return route.continue()
      const json = body => route.fulfill({ json: body })
      if (u.pathname === '/app-branding') return json({name:'S',logo:null})
      if (u.pathname === '/admin/overview-counts') return json({fields:{},roles:{}})
      if (u.pathname === '/admin/commission-activity') return json({total:1,items:[{notification_id:1,request_id:1,item_name:'Test pump',status:state.status,payer:'client',payer_name:'Client',amount:state.amount,currency:'RWF',current_percent:state.current_percent,submitted_at:'2026-10-01T10:00:00Z'}]})
      if (u.pathname === '/users/me') return json({ user_id: 1, full_name: 'Commission Client', role: admin ? 'admin' : 'client', account_field: 'medical', subscription: { plan: 'free', amount: '0', currency: 'RWF', period: 'yearly', payment_status: 'not_required' } })
      if (u.pathname === '/sale-items/public') return json({ total: 1, items: [{ item_id: 1, item_type: 'sale', listing_key: 'sale-1', name: 'Test pump', description: 'Working', price: 10000, currency: 'RWF' }] })
      if (u.pathname === '/item-requests/') return json(route.request().method() === 'POST' ? { request_id: 1 } : [{ request_id: 1, item_name: 'Test pump', status: 'pending', commission_status: state.status }])
      if (u.pathname === '/admin/commission-settings') {
        if (route.request().method() === 'PUT') settings = route.request().postDataJSON()
        return json(settings)
      }
      if (u.pathname.endsWith('/commission')) {
        if (route.request().method() === 'POST') state = { ...state, status: 'negotiating', payer: 'client', is_payer: true, listed_price: '10000', currency: 'RWF', current_percent: '5', amount: '500', revision: 1, momo_number: '0786854200', history: [] }
        return json(state)
      }
      if (u.pathname.endsWith('/commission/action')) {
        const data = route.request().postDataJSON(); actions.push(data)
        if (data.action === 'counter') state = { ...state, current_percent: '4.8', amount: '480' }
        if (data.action === 'accept') state.status = 'awaiting_payment'
        if (data.action === 'payment') state.status = 'pending_review'
        if (data.action === 'approve') state = { ...state, status: 'approved', seller: { name: 'Private Seller', phone: '+250788123456', email: 'seller@example.test' } }
        state.revision++
        return json(state)
      }
      return json([])
    })
    await page.goto('http://127.0.0.1:5199/#app')
    await page.getByRole('navigation').getByRole('button', { name: /My requests/ }).click()
    await page.getByRole('button', { name: 'Start negotiation', exact: true }).click()
    await page.getByText('My commission offer', { exact: false }).waitFor()
    await page.getByLabel('Your counteroffer (%)', { exact: true }).fill('1')
    await page.getByRole('button', { name: 'Negotiate', exact: true }).click()
    await page.getByText('4.8% = 480 RWF', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Accept fee and continue to payment', exact: true }).click()
    await page.getByText('0786854200', {exact:true}).waitFor()
    await page.getByLabel('MoMo transaction reference', { exact: true }).fill('MOMO-123')
    await page.getByRole('button', { name: 'Submit payment for review', exact: true }).click()
    await page.getByText('Commission status', { exact: false }).filter({ hasText: 'Awaiting' }).count()
    assert.equal(await page.getByText('Private Seller', { exact: true }).count(), 0)
    assert.deepEqual(actions.map(a => a.action), ['counter', 'accept', 'payment'])
    admin = true
    await page.evaluate(() => localStorage.setItem('user_role', 'admin'))
    await page.goto('http://127.0.0.1:5199/#app'); await page.reload()
    await page.getByRole('navigation').getByRole('button', { name: /Commission$/ }).click()
    await page.getByRole('button', { name: 'Set commission percentages', exact: true }).click()
    await page.getByLabel('Commission payer', { exact: true }).selectOption('seller')
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await page.getByText('Changes saved', { exact: true }).waitFor()
    assert.equal(settings.payer, 'seller')
    await page.getByRole('button', {name:'Review payments and unlock seller info',exact:true}).click()
    await page.getByRole('button', {name:'Review payment and unlock',exact:true}).click()
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Confirm payment and unlock', exact: true }).click()
    await page.getByText('Private Seller', { exact: true }).waitFor()
    console.log('PASS: client negotiation, payment submission, admin settings and contact unlock UI')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
