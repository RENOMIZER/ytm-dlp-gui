const $ = (id) => document.getElementById(id)
let language = window.electronAPI.language

$('dlButton').addEventListener('click', () => { downloadStart() })
$('setButton').addEventListener('click', () => { editOpen() })
$('settingsButton').addEventListener('click', () => { window.electronAPI.sendOpenSettings() })
$('locButton').addEventListener('click', () => { window.electronAPI.sendChooseDirectory() })

$('dlButton').title = language.index.download
$('setButton').title = language.index.settings
$('locButton').title = language.index.dlfolder
$('waitingLabel').textContent = language.index.waiting
$('extTitle').textContent = language.index.extension
$('ordTitle').textContent = language.index.order

window.electronAPI.onDownloadFinished(() => {
  setTimeout(() => {
    $('waitingLabel').textContent = language.index.waiting
    $('dlButton').removeAttribute('disabled')
  }, 1000)
})

window.electronAPI.onDownloadError(() => {
  $('waitingLabel').textContent = language.index.error
  setTimeout(() => {
    $('waitingLabel').textContent = language.index.waiting
    $('dlButton').removeAttribute('disabled')
  }, 2500)
})

window.electronAPI.onRecieveProgress((_event, prog) => {
  $('waitingLabel').textContent = language.index.downloading + ` ${prog}%`
})

window.electronAPI.onRecieveDirectory((_event, path) => {
  $('inputLocation').value = path
})

/* Listeners' functions */
const downloadStart = () => {
  let videoURL = $('inputURL').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    $('inputURL').value = ''
    return
  }

  window.electronAPI.sendStartDownload(videoURL.replace(/&list.*/gm, ''), $('inputLocation').value, $('extVal').value, $('ordSelect').value)
  $('dlButton').setAttribute('disabled', true)
  $('waitingLabel').textContent = language.index.downloading
  $('inputURL').value = ''
}

const editOpen = () => {
  let videoURL = $('inputURL').value

  if (videoURL.search(/(youtube|youtu)\.(com|be)/gm) === -1) {
    $('inputURL').value = ''
    return
  }
  else if (videoURL.search(/youtube\.com\/playlist\?/gm) !== -1) {
    return
  }

  window.electronAPI.sendOpenEdit(videoURL.replace(/&list.*/gm, ''))
}