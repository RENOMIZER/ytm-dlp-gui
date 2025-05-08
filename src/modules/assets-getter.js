const getLocalPath = require("./local-path").default;
const fs = require('fs-extra');
const path = require('path');

class AssetsGetter {
  constructor() {
    this.localPath = getLocalPath("ytm-dlp")
    this.configPath = path.join(this.localPath, "config.json")
    this.projectRoot = path.join(__dirname, "../..")
  }

  getLanguage() {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    let languagePath = path.join(this.projectRoot, "assets", "lang", config.lang + ".json")

    return JSON.parse(fs.readFileSync(languagePath))
  }

  getStyles() {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    let stylesPath = path.join(this.localPath, 'styles')

    let styleFiles = fs.readdirSync(stylesPath).filter(file => { return path.extname(file) === ".css"})
    let styles = styleFiles.map(e => { return e.slice(0, -4) })
    
    let currentStyle = config.style
    let currentStylePath = path.join(stylesPath, currentStyle + ".css")

    if (!fs.existsSync(currentStylePath)) {
      currentStyle = "mocha"
      currentStylePath = path.join(stylesPath, "mocha.css")
    }

    return [styles, currentStyle, currentStylePath]
  }

  getProxy() {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
  
    if (config.host) {
      return {
        proxy: config.proxy,
        proto: config.proto,
        host: config.host,
        port: config.port
      }
    }

    return { proxy: false }
  }
}

module.exports = { default: AssetsGetter }