window.onload = async () => {
  let language = await window.electronAPI.sendGetLanguage()
  let [ currentStyle, styles, currentStylePath ] = await window.electronAPI.sendGetStyles()

  styles.forEach(e => {
    const node = document.createElement("option");
    const textnode = document.createTextNode(e[0].toUpperCase() + e.replace(/^./, ''));
    node.appendChild(textnode);
    node.setAttribute('value', e)
    document.getElementById('styleSelect').appendChild(node)
  })

  const node = document.createElement("link");
  node.setAttribute('rel', 'stylesheet')
  node.setAttribute('href', currentStylePath)
  document.querySelector("head").appendChild(node)

  document.getElementById('header').textContent = language.about
  document.getElementById('langTxt').textContent = language.language + ':'
  document.getElementById('styleTxt').textContent = language.style + ':'
  document.getElementById('langSelect').value = language.current
  document.getElementById('styleSelect').value = currentStyle
}

window.onunload = () => {
  window.electronAPI.sendLanguage(document.getElementById('langSelect').value)
  window.electronAPI.sendChangeStyle(document.getElementById('styleSelect').value)
}