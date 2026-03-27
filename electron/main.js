const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const serve = require('electron-serve').default

const loadURL = serve({ directory: path.join(__dirname, '..', 'out') })

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 16 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '..', 'public', 'icon-512.png'),
    show: false,
  })

  loadURL(win)

  win.once('ready-to-show', () => win.show())

  // Open external links in the system browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
