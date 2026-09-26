const assert = require('node:assert/strict')
const { chromium } = require('../../desktop/node_modules/playwright-core')
;(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true})
 try {
  const page = await browser.newPage()
  let release
  await page.route('**/users/login', async route => { await new Promise(resolve => { release=resolve }); await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({detail:'Invalid credentials'})}) })
  await page.route('**/sale-items/public?*', route => route.fulfill({json:{items:[],total:0}}))
  await page.goto('http://localhost:5199/#login')
  await page.getByPlaceholder('Enter your email').fill('test@example.com')
  await page.getByPlaceholder('Enter your password').fill('test-password')
  const login = page.getByRole('button',{name:'Login',exact:true})
  await login.click()
  await page.getByRole('status').filter({hasText:'Please wait'}).waitFor()
  assert.equal(await login.isDisabled(),true)
  assert.equal(await login.locator('.animate-spin').count(),1)
  release()
  await page.getByText('Invalid email or password',{exact:true}).waitFor()
  assert.equal(await login.isEnabled(),true)
  const result=await page.evaluate(async()=>{
   const {preparePhoto}=await import('/src/preparePhoto.js')
   const canvas=document.createElement('canvas');canvas.width=3200;canvas.height=2400
   const ctx=canvas.getContext('2d');ctx.fillStyle='teal';ctx.fillRect(0,0,3200,2400)
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
   const file=new File([blob],'photo.png',{type:'image/png'})
   const original=await preparePhoto(file)
   const expected=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file)})
   const smaller=await preparePhoto(file,true)
   const image=new Image();image.src=smaller;await image.decode()
   return {unchanged:original===expected,reduced:smaller.length<original.length,width:image.width}
  })
  assert.deepEqual(result,{unchanged:true,reduced:true,width:1600})
  console.log('PASS: optional compression preserves original; sign-in spinner and duplicate-submit protection clear after error')
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1})

