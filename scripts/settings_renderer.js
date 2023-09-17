let art = document.getElementById('art')
let title = document.getElementById('title')
let artist = document.getElementById('artist')
let album = document.getElementById('album')
let year = document.getElementById('year')
let args = document.getElementById('args')

document.getElementById('accButton').addEventListener('click', applyMetadata)
document.getElementById('artButton').addEventListener('click', createArtButtons)
document.getElementById('decButton').addEventListener('click', () => { window.close() })
document.getElementById('fileButton').addEventListener('click', () => { window.electronAPI.sendArtOpen() })
document.getElementById('relButton').addEventListener('click', () => { window.electronAPI.sendMetadataReload() })
document.getElementById('urlButton').addEventListener('click', () => { window.electronAPI.sendArtGet() })

window.electronAPI.onRecieveMetadata((_event, metadata) => {
    art.setAttribute('src', metadata.art)
    title.value = metadata.track ? metadata.track : ""
    artist.value = metadata.artist ? metadata.artist : ""
    album.value = metadata.album ? metadata.album : ""
    year.value = metadata.upload_year ? metadata.upload_year : ""
    args.value = metadata.custom ? metadata.custom : ""
    document.getElementById('mp3Check').checked = metadata.mp3
    document.getElementById('header').textContent = "Edit"
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
        "custom": args.value,
        "art": art.getAttribute('src'),
        "mp3": document.getElementById('mp3Check').checked
    })

    window.close()
}

function createArtButtons() {
    document.getElementById('artButtonContainer').style.display = artButtonContainer.style.display === "flex" ? "none" : "flex"
    args.style.maxHeight = args.style.maxHeight === "75px" ? "95px" : "75px"
}