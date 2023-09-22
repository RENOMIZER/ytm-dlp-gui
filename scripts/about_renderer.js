window.onload = async () => { 
  let language = await window.electronAPI.sendGetLanguage()

  console.log(language)

  document.getElementById('header').textContent = language.about
  document.getElementById('langTxt').textContent = language.language + ':'
  document.getElementById('langSelect').value = language.current
}

window.onunload = () => {
  window.electronAPI.sendLanguage(document.getElementById('langSelect').value)
}