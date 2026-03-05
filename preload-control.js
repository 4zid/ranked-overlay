const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('control', {
  start: () => ipcRenderer.invoke('control-start'),
  stop: () => ipcRenderer.invoke('control-stop'),
  minimize: () => ipcRenderer.send('control-minimize'),
  closeToTray: () => ipcRenderer.send('control-close-to-tray'),
  onStateChange: (callback) => ipcRenderer.on('state-change', (_e, state) => callback(state)),
  onRankUpdate: (callback) => ipcRenderer.on('rank-update', (_e, data) => callback(data)),
  setRankedReminder: (enabled) => ipcRenderer.send('set-ranked-reminder', enabled)
});
