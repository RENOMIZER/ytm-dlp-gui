const { BrowserWindow, shell } = require('electron')
const path = require('path')

class WindowManager {
  constructor() {
    this.srcRoot = path.join(__dirname, "..")
    this.projectRoot = path.join(__dirname, "../..")
    this.basicConfig = {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#00000000',
        symbolColor: '#707070',
        height: 45,
      },
      show: false,
      webPreferences: {
        preload: path.join(this.srcRoot, "preload.js")
      },
      removeMenu: true,
      icon: path.join(this.projectRoot, "assets", "images", "icon.png"),
    }
  }

  createMain() {
    this.main = new BrowserWindow({
      ...{
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        menuBarVisible: false,
      }, ...this.basicConfig
    })

    this.main.loadFile(path.join(this.srcRoot, "screens", "index.html"))
    this.main.on('ready-to-show', () => { this.main.show() })
  }

  createAbout() {
    this.about = new BrowserWindow({
      ...{
        width: 450,
        height: 600,
        resizable: false,
        title: this.language.title,
        parent: this.main,
        modal: true,
      }, ...this.basicConfig
    })

    this.about.loadFile(path.join(this.srcRoot, "screens", "about.html"))
    this.about.on('ready-to-show', () => { this.about.show() })
    this.about.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  createProxy(config) {
    this.proxy = new BrowserWindow({
      ...{
        width: 450,
        height: 450,
        resizable: false,
        title: this.language.url,
        parent: this.about,
        modal: true,
      }, ...this.basicConfig
    })

    this.proxy.loadFile(path.join(this.srcRoot, "screens", "proxy.html"))
    this.proxy.on('ready-to-show', () => {
      if (config.host) this.proxy.webContents.send('sendProxy', config)
      this.proxy.show()
    })
    this.proxy.on('minimize', () => { this.main.minimize() })
  }

  createEdit() {
    this.edit = new BrowserWindow({
      ...{
        width: 600,
        height: 800,
        resizable: false,
        title: this.language.edit,
        parent: this.main,
        modal: true,
      }, ...this.basicConfig
    })

    this.edit.loadFile(path.join(this.srcRoot, "screens", "edit.html"))
    this.edit.on('ready-to-show', () => { this.edit.show() })
    this.edit.on('minimize', () => { this.main.minimize() })
  }

  createUrl() {
    this.url = new BrowserWindow({
      ...{
        width: 450,
        height: 150,
        resizable: false,
        title: this.language.url,
        parent: this.edit,
        modal: true,
      }, ...this.basicConfig
    })

    this.url.loadFile(path.join(this.srcRoot, "screens", "url.html"))
    this.url.on('ready-to-show', () => { this.url.show() })
  }

  send(window, channel, ...args) {
    window.webContents.send(channel, ...args)
  }

  setLanguage(language) {
    this.language = language
  }
}

module.exports = { default: WindowManager }