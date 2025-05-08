document.getElementById('accButton').addEventListener('click', () => { sendProxyConfig() })
document.getElementById('decButton').addEventListener('click', () => { window.close() })

window.onload = async () => {
  let language = await window.electronAPI.sendGetLanguage()

  let [_currentStyle, _styles, currentStylePath] = await window.electronAPI.sendGetStyles()

  const node = document.createElement("link");
  node.setAttribute('rel', 'stylesheet')
  node.setAttribute('href', currentStylePath)
  document.querySelector("head").appendChild(node)

  document.getElementById('header').textContent = language.proxy
  document.getElementById('hostTxt').textContent = language.host
  document.getElementById('portTxt').textContent = language.port
  document.getElementById('protoTxt').textContent = language.proto
  document.getElementById('enableTxt').textContent = language.enable
  document.getElementById('accButton').title = language.accept
  document.getElementById('decButton').title = language.decline
}

window.electronAPI.onRecieveProxy((_event, proxy) => {
  document.getElementById('hostInput').value = proxy.host
  document.getElementById('portInput').value = proxy.port
  document.getElementById('protoSelect').value = proxy.proto
  document.getElementById('enableSwitch').checked = proxy.proxy
})

const sendProxyConfig = () => {
  let proxy = {
    proxy: document.getElementById('enableSwitch').checked,
    proto: document.getElementById('protoSelect').value,
    host: document.getElementById('hostInput').value,
    port: document.getElementById('portInput').value
  }

  window.electronAPI.sendProxyConfig(proxy)
  window.close()
}