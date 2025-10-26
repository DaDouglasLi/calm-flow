const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'), // Optional icon
    titleBarStyle: 'default',
    show: false, // Don't show until ready
    backgroundColor: '#0a0a0a' // Match the app's dark background
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5175')
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile('dist/index.html')
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== 'http://localhost:5175' && parsedUrl.origin !== 'file://') {
      event.preventDefault()
    }
  })
}

// App event handlers
app.whenReady().then(() => {
  createWindow()

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // Set up application menu
  createMenu()
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reset to Pink Noise',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('reset-to-noise')
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.minimize()
          }
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.close()
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Calm Flow',
          click: () => {
            // You could create an about dialog here
            console.log('Calm Flow - A meditative typing experience')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('calm-flow')

// Export for potential use in renderer
module.exports = { mainWindow }
