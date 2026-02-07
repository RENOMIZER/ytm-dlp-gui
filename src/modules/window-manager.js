const { BrowserWindow } = require('electron')
const path = require('path')

class WindowManager {
  constructor(styleText) {
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
      icon: path.join(this.projectRoot, "assets", "images", "icon.png")
    }
    this.styleText = styleText
  }

  async createMain() {
    this.main = new BrowserWindow({
      ...{
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        menuBarVisible: false,
        sandbox: false
      }, ...this.basicConfig
    })

    this.main.loadFile(path.join(this.srcRoot, "screens", "index.html"))
    this.main.on('ready-to-show', async () => {
      this.mainCSSkey = await this.main.webContents.insertCSS(this.styleText)
      this.main.show()
    })
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
    this.edit.on('ready-to-show', () => {
      this.edit.webContents.insertCSS(this.styleText)
      this.edit.show()
    })
    this.edit.on('close', () => {
      this.main.focus();
    })
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
    this.url.on('ready-to-show', () => {
      this.url.webContents.insertCSS(this.styleText)
      this.url.show()
    })
    this.url.on('close', () => {
      this.edit.focus();
    })
  }

  createSettings(config) {
    this.settings = new BrowserWindow({
      ...{
        minWidth: 340,
        minHeight: 500,
        title: this.language.settings,
        parent: this.main,
        modal: true,
      }, ...this.basicConfig
    })

    this.settings.loadFile(path.join(this.srcRoot, "screens", "settings.html"))
    this.settings.on('ready-to-show', () => {
      this.settings.webContents.send('sendProxy', config)
      this.settings.webContents.insertCSS(this.styleText)
      this.settings.show()
    })
  }

  send(window, channel, ...args) {
    window.webContents.send(channel, ...args)
  }

  setLanguage(language) {
    this.language = language
  }

  async setStyle(styleText) {
    this.main.webContents.removeInsertedCSS(this.mainCSSkey)
    this.mainCSSkey = await this.main.webContents.insertCSS(styleText)
    this.styleText = styleText
  }
}

module.exports = { default: WindowManager }