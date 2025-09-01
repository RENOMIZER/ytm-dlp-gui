const $ = (id) => document.getElementById(id) 
let language = window.electronAPI.language

$('resetButton').addEventListener('click', () => {window.electronAPI.sendResetDependencies()})
$('clearButton').addEventListener('click', () => {window.electronAPI.sendClearCache()})
$('proxyButton').addEventListener('click', () => {window.electronAPI.sendOpenProxy()})

$('resetButton').title = language.resdep
$('clearButton').title = language.cache
$('proxyButton').title = language.proxy
$('header').textContent = language.about
$('langTxt').textContent = language.language + ':'
$('styleTxt').textContent = language.style + ':'
$('langSelect').value = language.current

window.onload = async () => {
  let { styles, currentStyle } = await window.electronAPI.sendGetStyles()

  styles.forEach(e => {
    const node = document.createElement("option");
    const textnode = document.createTextNode(e[0].toUpperCase() + e.replace(/^./, ''));
    node.appendChild(textnode);
    node.setAttribute('value', e)
    $('styleSelect').appendChild(node)
  })

  $('styleSelect').value = currentStyle
}

window.addEventListener("unload", () => {
  window.electronAPI.sendLanguage($('langSelect').value)
  window.electronAPI.sendChangeStyle($('styleSelect').value)
})