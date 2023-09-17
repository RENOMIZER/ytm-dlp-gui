const { contextBridge, ipcRenderer } = require('electron')

console.log('Preloaded!')

contextBridge.exposeInMainWorld('electronAPI', {
  /* To Main */
  sendStartDownload: (videoURL, path) => ipcRenderer.send('startDownload', videoURL, path),
  sendClickedSettings: (videoURL) => ipcRenderer.send('clickedSettings', videoURL),
  sendChangedMetadata: (metadata) => ipcRenderer.send('recieveMetadata', metadata),
  sendOnlineArt: (artURL) => ipcRenderer.send('receiveOnlineArt', artURL),
  sendChooseDirectory: () => ipcRenderer.send('chooseDirectory'),
  sendMetadataReload: () => ipcRenderer.send('metadataReload'),
  sendArtOpen: () => ipcRenderer.send('artOpen'),
  sendArtGet: () => ipcRenderer.send('artGet'),

  /* To Renderer */
  onDownloadFinished: (callback) => ipcRenderer.on('sendDownloadFinished', callback),
  onDownloadError: (callback) => ipcRenderer.on('sendDownloadError', callback),
  onRecieveDirectory: (callback) => ipcRenderer.on('sendDirectory', callback),
  onRecieveMetadata: (callback) => ipcRenderer.on('sendMetadata', callback),
  onRecieveArt: (callback) => ipcRenderer.on('sendArt', callback)
})