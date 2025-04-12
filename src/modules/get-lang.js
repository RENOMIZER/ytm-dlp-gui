const getLocalPath = require("./local-path").default;
const fs = require('fs-extra');
const path = require('path');

const getLang = () => {
  if (!fs.existsSync(path.join(getLocalPath("ytm-dlp"), "config.json")) || fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8') === '') {
    fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), `{"lang": "en", "style": "mocha"}`)
  }

  let local = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json")))
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../lang/', local.lang + '.json')))
}

module.exports = {
  default: getLang
}