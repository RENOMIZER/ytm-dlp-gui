/* Listeners */
document.getElementById('dlButton').addEventListener('click', downloadStart)
document.getElementById('setButton').addEventListener('click', settingsOpen)
document.getElementById('locButton').addEventListener('click', directoryChoose)

window.electronAPI.onDownloadFinished(() => {
  document.getElementById('waitingLabel').textContent = 'Ожидаю'
  document.getElementById('dlButton').removeAttribute('disabled')
})

window.electronAPI.onDownloadError(() => {
  document.getElementById('waitingLabel').textContent = 'Ошибка!'
  document.getElementById('dlButton').removeAttribute('disabled')
})

window.electronAPI.onRecieveMetadata((_event, metadata) => {
  console.log('Got metadata:', metadata)
})

window.electronAPI.onRecieveDirectory((_event, path) => {
  document.getElementById('inputLocation').value = path
})

/* Listeners' functions */
function downloadStart() {
  let videoURL = document.getElementById('inputURL').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    document.getElementById('inputURL').value = ''
    return
  }
  else if (videoURL.search(/music\.(youtube|youtu)\.(com|be)/gm) === -1) {
    window.electronAPI.sendStartDownload(videoURL.replace(/&list.*/gm, ''), document.getElementById('inputLocation').value)
  } else {
    window.electronAPI.sendStartDownload(videoURL.replace(/&list.*/gm, ''), document.getElementById('inputLocation').value)
  }

  document.getElementById('dlButton').setAttribute('disabled', true)
  document.getElementById('waitingLabel').textContent = 'Скачиваю...'
  document.getElementById('inputURL').value = ''
}

function settingsOpen() {
  let videoURL = document.getElementById('inputURL').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    document.getElementById('inputURL').value = ''
    return
  }
  else if (videoURL.search(/youtube\.com\/playlist\?/gm) !== -1) {
    return
  }
  else if (videoURL.search(/music\.(youtube|youtu)\.(com|be)/gm) === -1) {
    window.electronAPI.sendClickedSettings(videoURL.replace(/&list.*/gm, ''))
    return
  }

  window.electronAPI.sendClickedSettings(videoURL.replace(/&list.*/gm, ''))
}

function directoryChoose() {
  window.electronAPI.sendChooseDirectory()
}