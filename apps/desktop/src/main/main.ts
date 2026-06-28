import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeAppStartup, type AppStartupRuntime } from './startup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let startupRuntime: AppStartupRuntime | undefined;

async function createWindow() {
  startupRuntime = initializeAppStartup({
    dbPath: path.join(app.getPath('userData'), 'headquarters.local.sqlite'),
  });

  ipcMain.handle('headquarters:get-startup-status', () => startupRuntime?.status);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#070a0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env['VITE_DEV_SERVER_URL'];

  if (devServerUrl) {
    await win.loadURL(devServerUrl);
  } else {
    await win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  startupRuntime?.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  startupRuntime?.close();
});
