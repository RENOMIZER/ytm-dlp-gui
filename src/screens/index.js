let language

/* Listeners */
document.getElementById('dlButton').addEventListener('click', downloadStart)
document.getElementById('setButton').addEventListener('click', settingsOpen)
document.getElementById('aboutButton').addEventListener('click', () => { window.electronAPI.sendOpenAbout() })
document.getElementById('locButton').addEventListener('click', () => { window.electronAPI.sendChooseDirectory() })

window.onload = async () => {
	language = await window.electronAPI.sendGetLanguage()

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
function downloadStart() {
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

function settingsOpen() {
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