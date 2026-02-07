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
$('styleDirButton').innerHTML = language.settings.openLangDir
$('appearLabel').innerHTML = language.settings.appearance
$('proxyLabel').innerHTML = language.settings.proxy
$('depsLabel').innerHTML = language.settings.dependencies
$('aboutLabel').innerHTML = language.settings.about
$('workAreaHeader').innerHTML = language.settings.appearance

$('styleDirButton').addEventListener('click', () => window.electronAPI.sendOpenStylesDir())

$('dropZone').addEventListener('drop', (e) => {
  if ([...e.dataTransfer.items].some((item) => item.kind === "file")) {
    e.preventDefault();
  }
})

$('dropZone').addEventListener('dragover', (e) => {
  const fileItems = [...e.dataTransfer.items].filter(
    (item) => item.kind === "file",
  );
  if (fileItems.length > 0) {
    e.preventDefault();
    if (fileItems.some((item) => item.type.startsWith("text/css"))) {
      console.log(e.dataTransfer.files)
    } else {

      console.log('Wrong')
    }
  }
})

window.addEventListener("dragover", (e) => {
  const fileItems = [...e.dataTransfer.items].filter(
    (item) => item.kind === "file",
  );
  if (fileItems.length > 0) {
    e.preventDefault();
    if (!$('dropZone').contains(e.target)) {
      e.dataTransfer.dropEffect = "none";
    }
  }
})

$('dropZone').addEventListener('dragenter', () => { console.log('drag start') })
$('dropZone').addEventListener('dragleave', () => { console.log('drag end') })

$('menu').addEventListener('click', () => {
  if ($('appearOpt').checked) {
    $('workAreaHeader').innerHTML = language.settings.appearance
    $('appearSection').hidden = false
  }
  else {
    $('appearSection').hidden = true
  }

  if ($('proxyOpt').checked) {
    $('workAreaHeader').innerHTML = language.settings.proxy
    $('proxySection').hidden = false
  }
  else if (!$('proxySection').hidden) {
    sendProxyConfig()
    $('proxySection').hidden = true
  }

  if ($('depsOpt').checked) {
    $('workAreaHeader').innerHTML = language.settings.dependencies
    $('depsSection').hidden = false
  }
  else {
    $('depsSection').hidden = true
  }

  if ($('aboutOpt').checked) {
    $('workAreaHeader').innerHTML = language.settings.about
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
