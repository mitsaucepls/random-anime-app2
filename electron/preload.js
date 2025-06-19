const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onMoveModel: (callback) => ipcRenderer.on('move-model', callback)
});