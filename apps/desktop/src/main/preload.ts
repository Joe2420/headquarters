import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('headquarters', {
  version: '0.1.0',
  getStartupStatus: () => ipcRenderer.invoke('headquarters:get-startup-status'),
  listDoctrineRecords: () => ipcRenderer.invoke('headquarters:list-doctrine-records'),
  listDoctrineHistory: () => ipcRenderer.invoke('headquarters:list-doctrine-history'),
  promoteDoctrineCandidate: (input: unknown) => ipcRenderer.invoke('headquarters:promote-doctrine-candidate', input),
  createMission: (input: unknown) => ipcRenderer.invoke('headquarters:create-mission', input),
  startBriefing: (input: unknown) => ipcRenderer.invoke('headquarters:start-briefing', input),
  completeBriefing: (input: unknown) => ipcRenderer.invoke('headquarters:complete-briefing', input),
  startObservation: (input: unknown) => ipcRenderer.invoke('headquarters:start-observation', input),
  completeObservation: (input: unknown) => ipcRenderer.invoke('headquarters:complete-observation', input),
  requestAuthorization: (input: unknown) => ipcRenderer.invoke('headquarters:request-authorization', input),
  declareDeployment: (input: unknown) => ipcRenderer.invoke('headquarters:declare-deployment', input),
  requestReturnToBase: (input: unknown) => ipcRenderer.invoke('headquarters:return-to-base', input),
  saveDebrief: (input: unknown) => ipcRenderer.invoke('headquarters:save-debrief', input),
  archiveAfterDebrief: (input: unknown) => ipcRenderer.invoke('headquarters:archive-after-debrief', input),
});
