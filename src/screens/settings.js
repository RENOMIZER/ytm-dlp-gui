let art = document.getElementById('art')
let title = document.getElementById('title')
let artist = document.getElementById('artist')
let album = document.getElementById('album')
let year = document.getElementById('year')
let lyrics = document.getElementById('lrcSelect')
let language

document.getElementById('accButton').addEventListener('click', applyMetadata)
document.getElementById('artButton').addEventListener('click', createArtButtons)
document.getElementById('decButton').addEventListener('click', () => { window.close() })
document.getElementById('urlButton').addEventListener('click', () => { window.electronAPI.sendGetArt() })
document.getElementById('fileButton').addEventListener('click', () => { window.electronAPI.sendOpenArt() })
document.getElementById('relButton').addEventListener('click', () => { window.electronAPI.sendReloadMetadata() })

window.onload = async () => {
  language = await window.electronAPI.sendGetLanguage()

  let [_currentStyle, _styles, currentStylePath] = await window.electronAPI.sendGetStyles()

  const node = document.createElement("link");
  node.setAttribute('rel', 'stylesheet')
  node.setAttribute('href', currentStylePath)
  document.querySelector("head").appendChild(node)

  document.getElementById('header').textContent = language.loading
  document.getElementById('urlButton').textContent = language.loadurl
  document.getElementById('fileButton').textContent = language.loadfile
  document.getElementById('titleTxt').textContent = language.title + ':'
  document.getElementById('artistTxt').textContent = language.artist + ':'
  document.getElementById('albumTxt').textContent = language.album + ':'
  document.getElementById('yearTxt').textContent = language.year + ':'
  document.getElementById('genreTxt').textContent = language.genre + ':'
  document.getElementById('albumArtistTxt').textContent = language.albumartist + ':'
  document.getElementById('lrcTxt').textContent = language.lyrics + ':'
  document.getElementById('accButton').title = language.accept
  document.getElementById('relButton').title = language.reset
  document.getElementById('decButton').title = language.decline
  lyrics.title = language.lrcwarn
}

window.electronAPI.onRecieveMetadata((_event, metadata) => {
  art.setAttribute('src', metadata.art)
  title.value = metadata.track ? metadata.track : ""
  artist.value = metadata.artist ? metadata.artist : ""
  album.value = metadata.album ? metadata.album : ""
  year.value = metadata.upload_year ? metadata.upload_year : ""
  genre.value = metadata.genre ? metadata.genre : ""
  albumArtist.value = metadata.album_artist ? metadata.album_artist : ""
  lyrics.value = metadata.lyrics ? metadata.lyrics : "none"
  lyrics.removeAttribute('disabled')
  setTimeout(() => { document.getElementById('header').textContent = language.edit }, 1) // it works only this way and I don't know why
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
    "lyrics": lyrics.value
  })

  window.close()
}

function createArtButtons() {
  document.getElementById('artButtonContainer').style.display = artButtonContainer.style.display === "flex" ? "none" : "flex"
  document.getElementById('buttonContainer').style.paddingTop = buttonContainer.style.paddingTop === "0px" ? "35px" : "0px"
}