const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');

const APP_URL = 'https://ciphermeet.io';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'CipherMeet',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Allow media access
      webSecurity: true,
    },
  });

  // Grant media permissions automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = [
      'media',
      'mediaKeySystem',
      'display-capture',
      'screen-capture',
    ];
    callback(allowed.includes(permission));
  });

  // Handle permission checks (for getDisplayMedia, etc.)
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['media', 'display-capture', 'screen-capture'];
    return allowed.includes(permission);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Navigate external links in default browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL) && !url.startsWith('about:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle macOS screen recording permission
app.on('ready', () => {
  if (process.platform === 'darwin') {
    const { systemPreferences } = require('electron');
    if (systemPreferences.getMediaAccessStatus('screen') !== 'granted') {
      // The OS will prompt automatically when getDisplayMedia is called
    }
  }
});
