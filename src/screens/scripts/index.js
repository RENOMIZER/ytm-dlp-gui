const $ = (id) => document.getElementById(id) 
let language = window.electronAPI.language

$('dlButton').addEventListener('click', () => { downloadStart() })
$('setButton').addEventListener('click', () => { editOpen() })
$('aboutButton').addEventListener('click', () => { window.electronAPI.sendOpenAbout() })
$('locButton').addEventListener('click', () => { window.electronAPI.sendChooseDirectory() })

$('aboutButton').title = language.about
$('dlButton').title = language.download
$('setButton').title = language.settings
$('locButton').title = language.dlfolder
$('waitingLabel').textContent = language.waiting
$('extTitle').textContent = language.extension
$('ordTitle').textContent = language.order

window.electronAPI.onDownloadFinished(() => {
  setTimeout(() => {
    $('waitingLabel').textContent = language.waiting
    $('dlButton').removeAttribute('disabled')
  }, 1000)
})

window.electronAPI.onDownloadError(() => {
  $('waitingLabel').textContent = language.error
  setTimeout(() => {
    $('waitingLabel').textContent = language.waiting
    $('dlButton').removeAttribute('disabled')
  }, 2500)
})

window.electronAPI.onRecieveProgress((_event, prog) => {
  $('waitingLabel').textContent = language.downloading + ` ${prog}%`
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
  $('waitingLabel').textContent = language.downloading
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