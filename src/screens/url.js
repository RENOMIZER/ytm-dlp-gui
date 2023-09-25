document.getElementById('accButton').addEventListener('click', sendOnlineArt)

window.onload = async () => {
  language = await window.electronAPI.sendGetLanguage()

  document.getElementById('urlTxt').textContent = language.url
}

function sendOnlineArt() {
  window.electronAPI.sendOnlineArt(document.getElementById('urlInput').value)
  window.close()
}