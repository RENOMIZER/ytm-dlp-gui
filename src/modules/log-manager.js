const fs = require('fs-extra')
const path = require('path')
const os = require('os')

class LogManager {
  constructor() {
    Date.prototype.dateNow = function () {
      return this.getFullYear() + "-" + this.getMonth() + 1 + "-" + ((this.getDate() < 10) ? "0" : "") + this.getDate();
    }
    Date.prototype.timeNow = function () {
      return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
    }
    this.date = new Date()

    this.logStream = fs.createWriteStream(path.join(os.tmpdir(), `${this.date.dateNow()}-${this.date.timeNow()}-ytm-dlp.log`))
  }

  throwErr(message) {
    console.error(message)
    this.logStream.write(`[error] ${message}\n`)
  }

  logMessage(type, message) {
    console.log(message)
    if (type === null) {
      this.logStream.write(`${message}\n`)
    }
    this.logStream.write(`[${type}] ${message}\n`)
  }

  endLog() {
    this.logStream.end(`[info] Log end.`)
  }
}

module.exports = { default: LogManager }