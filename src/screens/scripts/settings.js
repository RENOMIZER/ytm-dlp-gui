const $ = (id) => document.getElementById(id)

$('langOpt').addEventListener('click', () => { if ($('langOpt').checked) $('workAreaHeader').innerHTML = 'Language' })
$('themeOpt').addEventListener('click', () => { if ($('themeOpt').checked) $('workAreaHeader').innerHTML = 'Themes' })
$('proxyOpt').addEventListener('click', () => { if ($('proxyOpt').checked) $('workAreaHeader').innerHTML = 'Proxy' })
$('depsOpt').addEventListener('click', () => { if ($('depsOpt').checked) $('workAreaHeader').innerHTML = 'Dependencies' })
$('aboutOpt').addEventListener('click', () => { if ($('aboutOpt').checked) $('workAreaHeader').innerHTML = 'About' })