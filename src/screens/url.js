const $ = (id) => document.getElementById(id) 
let language = window.electronAPI.language

$('accButton').addEventListener('click', () => { sendOnlineArt() })

$('urlTxt').textContent = language.url
$('accButton').title = language.accept

const sendOnlineArt = () => {
  if ($('urlInput').value !== '') {
    window.electronAPI.sendOnlineArt($('urlInput').value)
    window.close()
  }
}