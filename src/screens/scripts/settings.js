const $ = (id) => document.getElementById(id)
let language = window.electronAPI.language

$('hostTxt').textContent = language.host
$('portTxt').textContent = language.port
$('protoTxt').textContent = language.proto
// $('enableTxt').textContent = language.enable

$('menu').addEventListener('click', () => { 
    if ($('langOpt').checked) {
        $('workAreaHeader').innerHTML = 'Language'
    }

    if ($('themeOpt').checked) $('workAreaHeader').innerHTML = 'Themes'

    if ($('proxyOpt').checked) {
        $('workAreaHeader').innerHTML = 'Proxy'
        $('proxySection').hidden = false
    }
    else {
        $('proxySection').hidden = true
    }

    if ($('depsOpt').checked) $('workAreaHeader').innerHTML = 'Dependencies'

    if ($('aboutOpt').checked) {
        $('workAreaHeader').innerHTML = 'About'
        $('aboutSection').hidden = false
    }
    else {
        $('aboutSection').hidden = true
    }
})