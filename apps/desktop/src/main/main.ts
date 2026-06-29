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
  ipcMain.handle('headquarters:create-mission', (_event, input: unknown) => startupRuntime?.createMission(parseCreateMissionInput(input)));

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

function parseCreateMissionInput(input: unknown): { codename: string; objective: string } {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Mission creation input must be an object.');
  }

  const candidate = input as { codename?: unknown; objective?: unknown };

  if (typeof candidate.codename !== 'string' || typeof candidate.objective !== 'string') {
    throw new Error('Mission creation requires codename and objective.');
  }

  return {
    codename: candidate.codename,
    objective: candidate.objective,
  };
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  startupRuntime?.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  startupRuntime?.close();
});
