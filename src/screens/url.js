document.getElementById('accButton').addEventListener('click', sendOnlineArt)

window.onload = async () => {
  language = await window.electronAPI.sendGetLanguage()

  let [_currentStyle, _styles, currentStylePath] = await window.electronAPI.sendGetStyles()

  const node = document.createElement("link");
  node.setAttribute('rel', 'stylesheet')
  node.setAttribute('href', currentStylePath)
  document.querySelector("head").appendChild(node)

  document.getElementById('urlTxt').textContent = language.url
}

function sendOnlineArt() {
  window.electronAPI.sendOnlineArt(document.getElementById('urlInput').value)
  window.close()
}