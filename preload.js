const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getRankData: () => ipcRenderer.invoke('get-rank-data'),
  onRankData: (callback) => ipcRenderer.on('rank-data', (_event, data) => callback(data)),
  onOverlayShow: (callback) => ipcRenderer.on('overlay-show', () => callback()),
  onOverlayHide: (callback) => ipcRenderer.on('overlay-hide', () => callback())
});
