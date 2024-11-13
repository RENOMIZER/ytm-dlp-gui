let language

/* Listeners */
document.getElementById('dlButton').addEventListener('click', () => { downloadStart() })
document.getElementById('setButton').addEventListener('click', () => { settingsOpen() })
document.getElementById('aboutButton').addEventListener('click', () => { window.electronAPI.sendOpenAbout() })
document.getElementById('locButton').addEventListener('click', () => { window.electronAPI.sendChooseDirectory() })

window.onload = async () => {
  language = await window.electronAPI.sendGetLanguage()

  let [_currentStyle, _styles, currentStylePath] = await window.electronAPI.sendGetStyles()

  const node = document.createElement("link");
  node.setAttribute('rel', 'stylesheet')
  node.setAttribute('href', currentStylePath)
  document.querySelector("head").appendChild(node)

  document.getElementById('aboutButton').title = language.about
  document.getElementById('dlButton').title = language.download
  document.getElementById('setButton').title = language.settings
  document.getElementById('locButton').title = language.dlfolder
  document.getElementById('waitingLabel').textContent = language.waiting
  document.getElementById('extTitle').textContent = language.extension
  document.getElementById('ordTitle').textContent = language.order
}

window.electronAPI.onDownloadFinished(() => {
  setTimeout(() => {
    document.getElementById('waitingLabel').textContent = language.waiting
    document.getElementById('dlButton').removeAttribute('disabled')
  }, 1000)
})

window.electronAPI.onDownloadError(() => {
  document.getElementById('waitingLabel').textContent = language.error
  setTimeout(() => {
    document.getElementById('waitingLabel').textContent = language.waiting
    document.getElementById('dlButton').removeAttribute('disabled')
  }, 2500)
})

window.electronAPI.onRecieveProgress((_event, prog) => {
  document.getElementById('waitingLabel').textContent = language.downloading + ` ${prog}%`
})

window.electronAPI.onRecieveDirectory((_event, path) => {
  document.getElementById('inputLocation').value = path
})

/* Listeners' functions */
const downloadStart = () => {
  let videoURL = document.getElementById('inputURL').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    document.getElementById('inputURL').value = ''
    return
  }

  window.electronAPI.sendStartDownload(videoURL.replace(/&list.*/gm, ''), document.getElementById('inputLocation').value, document.getElementById('extVal').value, document.getElementById('ordSelect').value)
  document.getElementById('dlButton').setAttribute('disabled', true)
  document.getElementById('waitingLabel').textContent = language.downloading
  document.getElementById('inputURL').value = ''
}

const settingsOpen = () => {
  let videoURL = document.getElementById('inputURL').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    document.getElementById('inputURL').value = ''
    return
  }
  else if (videoURL.search(/youtube\.com\/playlist\?/gm) !== -1) {
    return
  }

  window.electronAPI.sendClickedSettings(videoURL.replace(/&list.*/gm, ''))
}