const ffbinaries = require('ffbinaries-plus')
const { exec } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const getLocalPath = require("./local-path").default

const YTDlpWrap = require('yt-dlp-wrap').default

class AssetsManager {
  constructor(logger) {
    this.localPath = getLocalPath("ytm-dlp");
    this.projectRoot = path.join(__dirname, "../..")
    this.configPath = path.join(this.localPath, "config.json")
    this.assetsPath = path.join(this.projectRoot, "assets")
    this.execExt = (os.platform() === 'win32' ? '.exe' : '')
    this.logger = logger

    if (os.platform() === 'linux' && !fs.existsSync(this.localPath)) {
      fs.mkdirSync(this.localPath)
    }

    if (!fs.existsSync(this.configPath) || !fs.readFileSync(this.configPath, "utf-8").length) {
      fs.copyFileSync(path.join(this.assetsPath, "config.json"), path.join(this.localPath, "config.json"))
    }

    this.setupAll(false)
  }

  setupAll(forceReinstallStyles) {
    this.setupStyles(forceReinstallStyles)
    this.setupYtDlp()
    this.setupFFmpeg()
  }

  async setupYtDlp() {
    let ytDlpDirPath = path.join(this.localPath, "yt-dlp")
    let ytDlpExecPath = path.join(ytDlpDirPath, "yt-dlp" + this.execExt)

    if (!fs.existsSync(ytDlpDirPath)) {
      fs.mkdir(ytDlpDirPath, (err) => { if (err) { this.logger.throwErr(err) } })
    }

    if (!fs.existsSync(path.join(ytDlpDirPath, "arguments"))) {
      fs.readFile(path.join(this.assetsPath, "arguments"), 'utf-8', (_err, data) => {
        data = data.replace(/<ffmpeg_directory>/, path.join(this.localPath, "ffmpeg"))
        fs.writeFile(path.join(ytDlpDirPath, "arguments"), data, (err) => { if (err) { this.logger.throwErr(err) } })
      })
    }

    exec(ytDlpExecPath, async (_error, _stdout, stderr) => {
      if (!stderr.includes('Usage:')) {
        this.logger.throwErr('YT-DLP Executable Error!')

        if (fs.existsSync(ytDlpExecPath)) {
          fs.unlinkSync(ytDlpExecPath)
        }

        await YTDlpWrap.downloadFromGithub(ytDlpExecPath)
      }
    })
  }

  setupFFmpeg() {
    let ffmpegDirPath = path.join(this.localPath, "ffmpeg")
    let ffmpegExecPath = path.join(ffmpegDirPath, "ffmpeg" + this.execExt)
    let ffprobeExecPath = path.join(ffmpegDirPath, "ffprobe" + this.execExt)

    exec(ffmpegExecPath, async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffmpeg version')) {
        this.logger.throwErr('FFMpeg Executable Error!')

        ffbinaries.downloadBinaries(['ffmpeg'], { destination: ffmpegDirPath }, (err) => { if (err) { this.logger.throwErr(err) } })
      }
    })

    exec(ffprobeExecPath, async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffprobe version')) {
        this.logger.throwErr('FFProbe Executable Error!')

        ffbinaries.downloadBinaries(['ffprobe'], { destination: ffmpegDirPath }, (err) => { if (err) { this.logger.throwErr(err) } })
      }
    })
  }

  setupStyles(force) {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    let stylesPath = path.join(this.localPath, 'styles')
    let currentStylePath = path.join(stylesPath, config.style + ".css")

    if (!fs.existsSync(currentStylePath) && !fs.existsSync(path.join(stylesPath, "mocha.css"))) {
      if (!fs.existsSync(path.join(stylesPath))) {
        fs.mkdir(stylesPath, (err) => { if (err) { this.logger.throwErr(err) } })
      }
      fs.copyFile(path.join(this.assetsPath, "styles", "mocha.css"), path.join(stylesPath, "mocha.css"))
    }

    if (config.fresh || force) {
      fs.readdirSync(path.join(this.assetsPath, "styles")).filter(file => { return path.extname(file) === ".css" }).forEach(e => {
        fs.copyFile(path.join(this.assetsPath, "styles", e), path.join(stylesPath, e))
      })
      fs.chmod(path.join(this.localPath, "styles"), '755')
      fs.writeFileSync(this.configPath, JSON.stringify({ ...config, ...{ fresh: false } }))
    }
  }

  getLanguage() {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    let languagePath = path.join(this.projectRoot, "assets", "lang", config.lang + ".json")

    return JSON.parse(fs.readFileSync(languagePath))
  }

  getStyles() {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    let stylesPath = path.join(this.localPath, 'styles')

    let styleFiles = fs.readdirSync(stylesPath).filter(file => { return path.extname(file) === ".css" })
    let styles = styleFiles.map(e => { return e.slice(0, -4) })

    let currentStyle = config.style
    let currentStylePath = path.join(stylesPath, currentStyle + ".css")

    if (!fs.existsSync(currentStylePath)) {
      currentStyle = "mocha"
      currentStylePath = path.join(stylesPath, "mocha.css")
    }

    let currentStyleText = fs.readFileSync(currentStylePath, 'utf-8')

    return { styles, currentStyle, currentStyleText }
  }

  getProxy() {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))

    return {
      proxy: config.proxy,
      proto: config.proto,
      host: config.host,
      port: config.port
    }
  }
}

module.exports = { default: AssetsManager }