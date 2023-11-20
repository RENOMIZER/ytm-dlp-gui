let art = document.getElementById('art')
let title = document.getElementById('title')
let artist = document.getElementById('artist')
let album = document.getElementById('album')
let year = document.getElementById('year')
let args = document.getElementById('args')
let language

document.getElementById('accButton').addEventListener('click', applyMetadata)
document.getElementById('artButton').addEventListener('click', createArtButtons)
document.getElementById('decButton').addEventListener('click', () => { window.close() })
document.getElementById('urlButton').addEventListener('click', () => { window.electronAPI.sendGetArt() })
document.getElementById('fileButton').addEventListener('click', () => { window.electronAPI.sendOpenArt() })
document.getElementById('relButton').addEventListener('click', () => { window.electronAPI.sendReloadMetadata() })

window.onload = async () => {
  language = await window.electronAPI.sendGetLanguage()

  document.getElementById('header').textContent = language.loading
  document.getElementById('urlButton').textContent = language.loadurl
  document.getElementById('fileButton').textContent = language.loadfile
  document.getElementById('titleTxt').textContent = language.title + ':'
  document.getElementById('artistTxt').textContent = language.artist + ':'
  document.getElementById('albumTxt').textContent = language.album + ':'
  document.getElementById('yearTxt').textContent = language.year + ':'
  document.getElementById('genreTxt').textContent = language.genre + ':'
  document.getElementById('albumArtistTxt').textContent = language.albumartist + ':'
}

window.electronAPI.onRecieveMetadata((_event, metadata) => {
  art.setAttribute('src', metadata.art)
  title.value = metadata.track ? metadata.track : ""
  artist.value = metadata.artist ? metadata.artist : ""
  album.value = metadata.album ? metadata.album : ""
  year.value = metadata.upload_year ? metadata.upload_year : ""
	genre.value = metadata.genre ? metadata.genre : ""
	albumArtist.value = metadata.album_artist ? metadata.album_artist : ""
  document.getElementById('header').textContent = language.edit
  document.getElementById('accButton').removeAttribute('disabled')
  document.getElementById('relButton').removeAttribute('disabled')
  document.getElementById('artButton').removeAttribute('disabled')
})

window.electronAPI.onRecieveArt((_event, newArt) => {
  art.setAttribute('src', newArt)
})

function applyMetadata() {
  window.electronAPI.sendChangedMetadata({
    "track": title.value,
    "artist": artist.value,
    "album": album.value,
    "upload_year": year.value,
		"genre": genre.value,
		"album_artist": albumArtist.value,
    "art": art.getAttribute('src'),
  })

  window.close()
}

function createArtButtons() {
  document.getElementById('artButtonContainer').style.display = artButtonContainer.style.display === "flex" ? "none" : "flex"
  args.style.maxHeight = args.style.maxHeight === "75px" ? "95px" : "75px"
}