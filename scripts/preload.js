const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  /* To Main */
  sendStartDownload: (videoURL, path) => ipcRenderer.send('startDownload', videoURL, path),
  sendClickedSettings: (videoURL) => ipcRenderer.send('clickedSettings', videoURL),
  sendChangedMetadata: (metadata) => ipcRenderer.send('recieveMetadata', metadata),
  sendOnlineArt: (artURL) => ipcRenderer.send('receiveOnlineArt', artURL),
  sendLanguage: (lang) => ipcRenderer.send('recieveLanguage', lang),
  sendChooseDirectory: () => ipcRenderer.send('chooseDirectory'),
  sendReloadMetadata: () => ipcRenderer.send('reloadMetadata'),
  sendGetLanguage: () => ipcRenderer.invoke('getLanguage'),
  sendOpenAbout: () => ipcRenderer.send('openAbout'),
  sendOpenArt: () => ipcRenderer.send('openArt'),
  sendGetArt: () => ipcRenderer.send('getArt'),

  /* To Renderer */
  onDownloadFinished: (callback) => ipcRenderer.on('sendDownloadFinished', callback),
  onDownloadError: (callback) => ipcRenderer.on('sendDownloadError', callback),
  onRecieveDirectory: (callback) => ipcRenderer.on('sendDirectory', callback),
  onRecieveMetadata: (callback) => ipcRenderer.on('sendMetadata', callback),
  onRecieveArt: (callback) => ipcRenderer.on('sendArt', callback),
})