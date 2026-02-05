const $ = (id) => document.getElementById(id)
let language = window.electronAPI.language
let style = ''
let oldProxy = {}

$('hostTxt').textContent = language.settings.host
$('portTxt').textContent = language.settings.port
$('protoTxt').textContent = language.settings.proto
$('enableTxt').textContent = language.settings.enable
$('langTxt').textContent = language.settings.language
$('styleTxt').textContent = language.settings.style
$('langSelect').value = language.current

$('menu').addEventListener('click', () => {
  if ($('langOpt').checked) {
    $('workAreaHeader').innerHTML = 'Language'
    $('langSection').hidden = false
  }
  else {
    $('langSection').hidden = true
  }

  if ($('themeOpt').checked) {
    $('workAreaHeader').innerHTML = 'Themes'
    $('themeSection').hidden = false
  }
  else {
    $('themeSection').hidden = true
  }

  if ($('proxyOpt').checked) {
    $('workAreaHeader').innerHTML = 'Proxy'
    $('proxySection').hidden = false
  }
  else if (!$('proxySection').hidden) {
    sendProxyConfig()
    $('proxySection').hidden = true
  }

  if ($('depsOpt').checked) {
    $('workAreaHeader').innerHTML = 'Dependencies'
    $('depsSection').hidden = false
  }
  else {
    $('depsSection').hidden = true
  }

  if ($('aboutOpt').checked) {
    $('workAreaHeader').innerHTML = 'About'
    $('aboutSection').hidden = false
  }
  else {
    $('aboutSection').hidden = true
  }
})

const sendProxyConfig = () => {
  let proxy = {
    proxy: $('enableSwitch').checked,
    proto: $('protoSelect').value,
    host: $('hostInput').value,
    port: $('portInput').value
  }

  if (JSON.stringify(proxy) !== JSON.stringify(oldProxy)) {
    window.electronAPI.sendProxyConfig(proxy)
    oldProxy = proxy
  }
}

const sendLanguageSelection = () => {
  if ($('langSelect').value !== language.current) {
    window.electronAPI.sendLanguage($('langSelect').value)
  }
}

const sendStyleSelection = () => {
  if ($('styleSelect').value !== style) {
    window.electronAPI.sendChangeStyle($('styleSelect').value)
  }
}

window.electronAPI.onRecieveProxy((_event, proxy) => {
  oldProxy = {
    proxy: proxy.proxy,
    proto: proxy.proto,
    host: proxy.host,
    port: proxy.port
  }

  $('hostInput').value = proxy.host
  $('portInput').value = proxy.port
  $('protoSelect').value = proxy.proto
  $('enableSwitch').checked = proxy.proxy
})

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
  style = currentStyle
}

window.onbeforeunload = () => {
  sendProxyConfig()
  sendStyleSelection()
  sendLanguageSelection()
}
