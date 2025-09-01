const $ = (id) => document.getElementById(id) 
let language = window.electronAPI.language

$('accButton').addEventListener('click', () => { sendProxyConfig() })
$('decButton').addEventListener('click', () => { window.close() })

$('header').textContent = language.proxy
$('hostTxt').textContent = language.host
$('portTxt').textContent = language.port
$('protoTxt').textContent = language.proto
$('enableTxt').textContent = language.enable
$('accButton').title = language.accept
$('decButton').title = language.decline

window.electronAPI.onRecieveProxy((_event, proxy) => {
  $('hostInput').value = proxy.host
  $('portInput').value = proxy.port
  $('protoSelect').value = proxy.proto
  $('enableSwitch').checked = proxy.proxy
})

const sendProxyConfig = () => {
  let proxy = {
    proxy: $('enableSwitch').checked,
    proto: $('protoSelect').value,
    host: $('hostInput').value,
    port: $('portInput').value
  }

  window.electronAPI.sendProxyConfig(proxy)
  window.close()
}