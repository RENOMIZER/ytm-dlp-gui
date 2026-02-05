const $ = (id) => document.getElementById(id)
let language = window.electronAPI.language

let art = $('art')
let title = $('title')
let artist = $('artist')
let album = $('album')
let year = $('year')
let lyrics = $('lrcSelect')
let genre = $('genre')
let albumArtist = $('albumArtist')

$('accButton').addEventListener('click', () => { applyMetadata() })
$('artButton').addEventListener('click', () => { createArtButtons() })
$('decButton').addEventListener('click', () => { window.close() })
$('urlButton').addEventListener('click', () => { window.electronAPI.sendOpenUrl() })
$('fileButton').addEventListener('click', () => { window.electronAPI.sendOpenArt() })
$('relButton').addEventListener('click', () => { window.electronAPI.sendReloadMetadata() })

$('header').textContent = language.edit.loading
$('urlButton').textContent = language.edit.loadurl
$('fileButton').textContent = language.edit.loadfile
$('titleTxt').textContent = language.edit.title + ':'
$('artistTxt').textContent = language.edit.artist + ':'
$('albumTxt').textContent = language.edit.album + ':'
$('yearTxt').textContent = language.edit.year + ':'
$('genreTxt').textContent = language.edit.genre + ':'
$('albumArtistTxt').textContent = language.edit.albumartist + ':'
$('lrcTxt').textContent = language.edit.lyrics + ':'
$('accButton').title = language.edit.accept
$('relButton').title = language.edit.reset
$('decButton').title = language.edit.decline
lyrics.title = language.edit.lrcwarn

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
  setTimeout(() => { $('header').textContent = language.edit.edit }, 1) // it works only this way and I don't know why
  $('accButton').removeAttribute('disabled')
  $('relButton').removeAttribute('disabled')
  $('artButton').removeAttribute('disabled')
})

window.electronAPI.onRecieveArt((_event, newArt) => {
  art.setAttribute('src', newArt)
})

const applyMetadata = () => {
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

const createArtButtons = () => {
  $('artButtonContainer').style.display = $('artButtonContainer').style.display === "flex" ? "none" : "flex"
  $('metaContainer').style.paddingTop = $('metaContainer').style.paddingTop === "0px" ? "5%" : "0px"
}