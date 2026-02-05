const $ = (id) => document.getElementById(id)
let language = window.electronAPI.language

$('accButton').addEventListener('click', () => { sendOnlineArt() })

$('urlTxt').textContent = language.url.title
$('accButton').title = language.url.accept

const sendOnlineArt = () => {
  if ($('urlInput').value !== '') {
    window.electronAPI.sendOnlineArt($('urlInput').value)
    window.close()
  }
}