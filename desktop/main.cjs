const { app, BrowserWindow, shell, session } = require('electron')
const path = require('node:path')
const { WEBSITE, classifyNavigation } = require('./navigation.cjs')

let window
app.setAppUserModelId('online.simeon.desktop')
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (window) {
      if (window.isMinimized()) window.restore()
      window.show()
      window.focus()
    }
  })
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    session.defaultSession.setPermissionCheckHandler(() => false)
    window = new BrowserWindow({
      title: 'Simeon', width: 1280, height: 850, minWidth: 360, minHeight: 500,
      show: process.env.SIMEON_SMOKE_TEST !== '1',
      icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
    })
    const openExternal = (url) => shell.openExternal(url).catch(() => {})
    window.webContents.setWindowOpenHandler(({ url }) => {
      const destination = classifyNavigation(url)
      if (destination === 'internal') window.loadURL(url).catch(() => {})
      if (destination === 'external') openExternal(url)
      return { action: 'deny' }
    })
    const guardNavigation = (event, url) => {
      const destination = classifyNavigation(url)
      if (destination !== 'internal') {
        event.preventDefault()
        if (destination === 'external') openExternal(url)
      }
    }
    window.webContents.on('will-navigate', guardNavigation)
    window.webContents.on('will-redirect', guardNavigation)
    window.webContents.on('will-attach-webview', event => event.preventDefault())
    window.webContents.on('did-fail-load', (_event, code, _description, url, isMainFrame) => {
      if (isMainFrame && code !== -3 && classifyNavigation(url) === 'internal') {
        window.loadFile(path.join(__dirname, 'offline.html')).catch(() => {})
      }
    })
    window.on('closed', () => { window = null })
    window.loadURL(`${WEBSITE}/#home`).catch(() => {})
  })
  app.on('window-all-closed', () => app.quit())
}
