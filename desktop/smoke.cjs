const { _electron: electron } = require('playwright-core')
const path = require('node:path')
const assert = require('node:assert/strict')

async function check() {
  const environment = { ...process.env, SIMEON_SMOKE_TEST: '1' }
  delete environment.ELECTRON_RUN_AS_NODE
  const desktop = await electron.launch({
    executablePath: path.join(__dirname, 'release', 'win-unpacked', 'Simeon.exe'),
    env: environment,
    timeout: 60000,
  })
  try {
    const page = await desktop.firstWindow()
    await page.waitForURL('https://simeon-frontend.onrender.com/**', { timeout: 60000 })
    await page.getByText('Simeon', { exact: true }).first().waitFor({ timeout: 60000 })
    const preferences = await desktop.evaluate(({ BrowserWindow }) => {
      const prefs = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()
      return { nodeIntegration: prefs.nodeIntegration, contextIsolation: prefs.contextIsolation, sandbox: prefs.sandbox }
    })
    assert.deepEqual(preferences, { nodeIntegration: false, contextIsolation: true, sandbox: true })
    assert.equal(await page.evaluate(() => typeof window.require), 'undefined')
    await page.evaluate(() => { window.location.hash = '#login' })
    await page.locator('input[type="password"]').first().waitFor()
    console.log('PASS: packaged Windows app loads Simeon and login; renderer is sandboxed without Node access')
  } finally {
    await desktop.close()
  }
}
check().catch(error => { console.error(error.message); process.exitCode = 1 })
