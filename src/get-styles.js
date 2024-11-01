const getLocalPath = require("./local-path").default;
const fs = require('fs-extra');
const path = require('path');

const getStyles = () => {
  if (!fs.existsSync(path.join(getLocalPath('ytm-dlp'), 'styles/mocha.css'))) {
    fs.copyFile(path.join(__dirname, 'styles/mocha.css'), path.join(getLocalPath('ytm-dlp'), 'styles/mocha.css'))
  }

  let files = fs.readdirSync(path.join(getLocalPath('ytm-dlp'), 'styles'), { withFileTypes: false })
  files = files.filter(e => { return e.search(/\.css/) !== -1 })
  let styles = files.map(e => { return e.replace(/\.css/, '') })

  let data = fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8')
  let currentStyle = JSON.parse(data).style

  if (fs.existsSync(path.join(getLocalPath('ytm-dlp'), 'styles', currentStyle + '.css'))) {
    var currentStylePath = path.join(getLocalPath('ytm-dlp'), 'styles', currentStyle + '.css')
  } else {
    var currentStylePath = path.join(getLocalPath('ytm-dlp'), 'styles/mocha.css')
    currentStyle = "mocha"
  }

  return [currentStyle, styles, currentStylePath]
}

module.exports = {
  default: getStyles
}