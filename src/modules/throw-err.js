const fs = require('fs-extra')
const path = require('path')
const os = require('os')

Date.prototype.dateNow = function () {
  return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "-" + this.getMonth() + 1 + "-" + this.getFullYear();
}
Date.prototype.timeNow = function () {
  return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
}
const date = new Date()

const logStream = fs.createWriteStream(path.join(os.tmpdir(), `ytm-dlp-log-${date.dateNow()}-${date.timeNow()}.log`))

const throwErr = (err) => {
  console.error(err)
  logStream.write(`[error] ` + err + '\n\n')
}

module.exports = {
  throwErr,
  logStream
}