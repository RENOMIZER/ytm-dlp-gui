const ffbinaries = require('ffbinaries-plus')
const { exec } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const getLocalPath = require("./local-path").default
const { throwErr } = require('./throw-err')

const YTDlpWrap = require('yt-dlp-wrap').default

class AssetsManager {
  constructor() {
    this.localPath = getLocalPath("ytm-dlp");
    this.configPath = path.join(this.localPath, "config.json")
    this.assetsPath = path.join(__dirname, "../..", "assets")
    this.execExt = (os.platform() === 'win32' ? '.exe' : '')

    if (!fs.existsSync(this.configPath) || !fs.readFileSync(this.configPath, "utf-8").length) {
      fs.writeFileSync(this.configPath, '{"lang":"en","style":"mocha","proxy":false,"proto":"http","host":"","port":""}')
    }
     
    this.setupStyles()
    this.setupYtDlp()
    this.setupFFmpeg()
  }

  setupAll() {
    this.setupStyles()
    this.setupYtDlp()
    this.setupFFmpeg()
  }

  async setupYtDlp() {
    let ytDlpDirPath = path.join(this.localPath, "yt-dlp")
    let ytDlpExecPath = path.join(ytDlpDirPath, "yt-dlp" + this.execExt)

    if (!fs.existsSync(ytDlpDirPath)) {
      fs.mkdir(ytDlpDirPath, (err) => { if (err) { throwErr(err) } })
    }

    if (!fs.existsSync(path.join(ytDlpDirPath, "arguments"))) {
      fs.readFile(path.join(this.assetsPath, "arguments"), 'utf-8', (_err, args) => {
        args = args.replace(/<ffmpeg_directory>/, path.join(this.localPath, "ffmpeg"))
        fs.writeFile(path.join(ytDlpDirPath, "arguments"), args, (err) => { if (err) { throwErr(err) } })
      })
    }

    exec(ytDlpExecPath, async (_error, _stdout, stderr) => {
      if (!stderr.includes('Usage:')) {
        throwErr('YT-DLP Executable Error!')

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
        throwErr('FFMpeg Executable Error!')

        ffbinaries.downloadBinaries(['ffmpeg'], { destination: ffmpegDirPath }, (err) => { if (err) { throwErr(err) } })
      }
    })

    exec(ffprobeExecPath, async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffprobe version')) {
        throwErr('FFProbe Executable Error!')

        ffbinaries.downloadBinaries(['ffprobe'], { destination: ffmpegDirPath }, (err) => { if (err) { throwErr(err) } })
      }
    })
  }

  setupStyles() {
    let config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    let stylesPath = path.join(this.localPath, 'styles')
    let currentStylePath = path.join(stylesPath, config.style + ".css")

    if (!fs.existsSync(stylesPath)) {
      fs.readdirSync(path.join(this.assetsPath, "styles")).filter(file => { return path.extname(file) === ".css"}).forEach(e => {
        fs.copyFile(path.join(this.assetsPath, "styles", e), path.join(stylesPath, e))
      })
      fs.chmod(path.join(this.localPath, "styles"), '755')
    }

    if (!fs.existsSync(currentStylePath) && !fs.existsSync(path.join(stylesPath, "mocha.css"))) {
      if (!fs.existsSync(path.join(stylesPath))) {
        fs.mkdir(stylesPath, (err) => { if (err) { throwErr(err) } })
      }
      fs.copyFile(path.join(this.assetsPath, "styles", "mocha.css"), path.join(stylesPath, "mocha.css"))
    }
  }
}

module.exports = { default: AssetsManager }