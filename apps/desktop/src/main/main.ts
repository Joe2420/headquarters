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
  ipcMain.handle('headquarters:list-doctrine-records', () => startupRuntime?.listDoctrineRecords());
  ipcMain.handle('headquarters:list-doctrine-history', () => startupRuntime?.listDoctrineHistory());
  ipcMain.handle('headquarters:promote-doctrine-candidate', (_event, input: unknown) => startupRuntime?.promoteDoctrineCandidate(parseDoctrinePromotionInput(input)));
  ipcMain.handle('headquarters:create-mission', (_event, input: unknown) => startupRuntime?.createMission(parseCreateMissionInput(input)));
  ipcMain.handle('headquarters:start-briefing', (_event, input: unknown) => startupRuntime?.startBriefing(parseMissionCommandInput(input)));
  ipcMain.handle('headquarters:complete-briefing', (_event, input: unknown) => startupRuntime?.completeBriefing(parseMissionCommandInput(input)));
  ipcMain.handle('headquarters:start-observation', (_event, input: unknown) => startupRuntime?.startObservation(parseMissionCommandInput(input)));
  ipcMain.handle('headquarters:complete-observation', (_event, input: unknown) => startupRuntime?.completeObservation(parseMissionCommandInput(input)));
  ipcMain.handle('headquarters:request-authorization', (_event, input: unknown) => startupRuntime?.requestAuthorization(parseAuthorizationInput(input)));
  ipcMain.handle('headquarters:declare-deployment', (_event, input: unknown) => startupRuntime?.declareDeployment(parseMissionCommandInput(input)));
  ipcMain.handle('headquarters:return-to-base', (_event, input: unknown) => startupRuntime?.requestReturnToBase(parseMissionCommandInput(input)));
  ipcMain.handle('headquarters:save-debrief', (_event, input: unknown) => startupRuntime?.saveDebrief(parseDebriefInput(input)));
  ipcMain.handle('headquarters:archive-after-debrief', (_event, input: unknown) => startupRuntime?.archiveAfterDebrief(parseMissionCommandInput(input)));

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

function parseMissionCommandInput(input: unknown): { missionId: string; reason?: string } {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Mission command input must be an object.');
  }

  const candidate = input as { missionId?: unknown; reason?: unknown };

  if (typeof candidate.missionId !== 'string') {
    throw new Error('Mission command requires missionId.');
  }

  return {
    missionId: candidate.missionId,
    ...(typeof candidate.reason === 'string' ? { reason: candidate.reason } : {}),
  };
}

function parseAuthorizationInput(input: unknown): {
  missionId: string;
  operatorJustification: string;
  invalidation: string;
} {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Mission authorization input must be an object.');
  }

  const candidate = input as {
    missionId?: unknown;
    operatorJustification?: unknown;
    invalidation?: unknown;
  };

  if (
    typeof candidate.missionId !== 'string'
    || typeof candidate.operatorJustification !== 'string'
    || typeof candidate.invalidation !== 'string'
  ) {
    throw new Error('Mission authorization requires missionId, operatorJustification, and invalidation.');
  }

  return {
    missionId: candidate.missionId,
    operatorJustification: candidate.operatorJustification,
    invalidation: candidate.invalidation,
  };
}

function parseDebriefInput(input: unknown): {
  missionId: string;
  behaviorSummary: string;
  disciplineNotes: string;
  lesson: string;
} {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Mission debrief input must be an object.');
  }

  const candidate = input as {
    missionId?: unknown;
    behaviorSummary?: unknown;
    disciplineNotes?: unknown;
    lesson?: unknown;
  };

  if (
    typeof candidate.missionId !== 'string'
    || typeof candidate.behaviorSummary !== 'string'
    || typeof candidate.disciplineNotes !== 'string'
    || typeof candidate.lesson !== 'string'
  ) {
    throw new Error('Mission debrief requires missionId, behaviorSummary, disciplineNotes, and lesson.');
  }

  return {
    missionId: candidate.missionId,
    behaviorSummary: candidate.behaviorSummary,
    disciplineNotes: candidate.disciplineNotes,
    lesson: candidate.lesson,
  };
}

function parseDoctrinePromotionInput(input: unknown): {
  candidateId: string;
  title: string;
  summary: string;
  sourceId: string;
  archiveId: string;
  excerpt: string;
} {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Doctrine promotion input must be an object.');
  }

  const candidate = input as {
    candidateId?: unknown;
    title?: unknown;
    summary?: unknown;
    sourceId?: unknown;
    archiveId?: unknown;
    excerpt?: unknown;
  };

  if (
    typeof candidate.candidateId !== 'string'
    || typeof candidate.title !== 'string'
    || typeof candidate.summary !== 'string'
    || typeof candidate.sourceId !== 'string'
    || typeof candidate.archiveId !== 'string'
    || typeof candidate.excerpt !== 'string'
  ) {
    throw new Error('Doctrine promotion requires candidateId, title, summary, sourceId, archiveId, and excerpt.');
  }

  return {
    candidateId: candidate.candidateId,
    title: candidate.title,
    summary: candidate.summary,
    sourceId: candidate.sourceId,
    archiveId: candidate.archiveId,
    excerpt: candidate.excerpt,
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
