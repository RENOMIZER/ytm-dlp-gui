document.getElementById('accButton').addEventListener('click', sendOnlineArt)

function sendOnlineArt() {
  window.electronAPI.sendOnlineArt(document.getElementById('urlInput').value)
  window.close()
}