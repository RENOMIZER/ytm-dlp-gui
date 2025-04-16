const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  /* To Main */
  sendStartDownload: (videoURL, path, ext, order) => ipcRenderer.send('startDownload', videoURL, path, ext, order),
  sendClickedSettings: (videoURL) => ipcRenderer.send('clickedSettings', videoURL),
  sendChangedMetadata: (metadata) => ipcRenderer.send('recieveMetadata', metadata),
  sendOnlineArt: (artURL) => ipcRenderer.send('receiveOnlineArt', artURL),
  sendChangeStyle: (style) => ipcRenderer.send('changeStyle', style),
  sendProxyConfig: (proxy) => ipcRenderer.send('updateProxy', proxy),
  sendLanguage: (lang) => ipcRenderer.send('recieveLanguage', lang),
  sendChooseDirectory: () => ipcRenderer.send('chooseDirectory'),
  sendReloadMetadata: () => ipcRenderer.send('reloadMetadata'),
  sendResetDependencies: () => ipcRenderer.send('resetDeps'),
  sendGetLanguage: () => ipcRenderer.invoke('getLanguage'),
  sendGetStyles: () => ipcRenderer.invoke('getStyles'),
  sendClearCache: () => ipcRenderer.send('clearCache'),
  sendOpenAbout: () => ipcRenderer.send('openAbout'),
  sendOpenProxy: () => ipcRenderer.send('openProxy'),
  sendOpenArt: () => ipcRenderer.send('openArt'),
  sendGetArt: () => ipcRenderer.send('getArt'),

  /* To Renderer */
  onDownloadFinished: (callback) => ipcRenderer.on('sendDownloadFinished', callback),
  onDownloadError: (callback) => ipcRenderer.on('sendDownloadError', callback),
  onRecieveDirectory: (callback) => ipcRenderer.on('sendDirectory', callback),
  onRecieveMetadata: (callback) => ipcRenderer.on('sendMetadata', callback),
	onRecieveProgress: (callback) => ipcRenderer.on('sendProgress', callback),
  onRecieveProxy: (callback) => ipcRenderer.on('sendProxy', callback),
  onRecieveArt: (callback) => ipcRenderer.on('sendArt', callback),
})
