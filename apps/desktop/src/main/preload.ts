import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('headquarters', {
  version: '0.1.0',
  getStartupStatus: () => ipcRenderer.invoke('headquarters:get-startup-status'),
});
