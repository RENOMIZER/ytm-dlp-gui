document.getElementById('accButton').addEventListener('click', sendOnlineArt)

window.onload = async () => {
  language = await window.electronAPI.sendGetLanguage()

  let [_currentStyle, _styles, currentStylePath] = await window.electronAPI.sendGetStyles()

  const node = document.createElement("link");
  node.setAttribute('rel', 'stylesheet')
  node.setAttribute('href', currentStylePath)
  document.querySelector("head").appendChild(node)

  document.getElementById('urlTxt').textContent = language.url
  document.getElementById('accButton').title = language.accept
}

function sendOnlineArt() {
  if (document.getElementById('urlInput').value !== '') {
    window.electronAPI.sendOnlineArt(document.getElementById('urlInput').value)
    window.close()
  }
}