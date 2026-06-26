import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('headquarters', {
  version: '0.1.0',
});
