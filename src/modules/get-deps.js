const ffbinaries = require('ffbinaries-plus')
const { exec } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const getLocalPath = require("./local-path").default
const { throwErr } = require('./throw-err')

const YTDlpWrap = require('yt-dlp-wrap').default

const getDeps = async () => {
  if (!fs.existsSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp"))) {
    fs.mkdir(path.join(getLocalPath("ytm-dlp"), "yt-dlp"), { recursive: true }, (err) => { if (err) { throwErr(err) } })
  }

  if (!fs.existsSync(path.join(getLocalPath("ytm-dlp"), 'yt-dlp/yt-dlp' + (os.platform() === 'win32' ? '.exe' : '')))) {
    await YTDlpWrap.downloadFromGithub(path.join(getLocalPath("ytm-dlp"), 'yt-dlp/yt-dlp' + (os.platform() === 'win32' ? '.exe' : '')))
  }
  else {
    exec(path.join(getLocalPath("ytm-dlp"), "yt-dlp/yt-dlp"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('Usage:')) {
        throwErr('YT-DLP executable error')

        fs.unlinkSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp/yt-dlp" + (os.platform() === 'win32' ? '.exe' : '')))
        await YTDlpWrap.downloadFromGithub(path.join(getLocalPath("ytm-dlp"), "yt-dlp/yt-dlp" + (os.platform() === 'win32' ? '.exe' : '')))
      }
    })
  }

  if (!fs.existsSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp/arguments.list"))) {
    fs.readFile(path.join(__dirname, 'arguments.list'), 'utf-8', (err, data) => {
      if (err) { throwErr(err) }

      data = data.replace(/<ffmpeg_directory>/, path.join(getLocalPath("ytm-dlp"), "ffmpeg"))

      fs.writeFile(path.join(getLocalPath('ytm-dlp'), 'yt-dlp/arguments.list'), data, (err) => { if (err) { throwErr(err) } })
    })
  }

  if (!fs.existsSync(path.join(getLocalPath('ytm-dlp'), 'styles')) || fs.readdirSync(path.join(getLocalPath('ytm-dlp'), 'styles')) === '') {
    fs.copy(path.join(__dirname, 'styles'), path.join(getLocalPath('ytm-dlp'), 'styles'), { recursive: true }, (err) => {
      if (err) { throwErr(err) }

      fs.chmod(path.join(getLocalPath('ytm-dlp'), 'styles'), '755')
    })
  }

  if (!fs.existsSync(path.join(getLocalPath("ytm-dlp"), "ffmpeg", "ffmpeg"  + (os.platform() === 'win32' ? '.exe' : ''))) || path.join(getLocalPath("ytm-dlp"), "ffmpeg", "ffprobe"  + (os.platform() === 'win32' ? '.exe' : ''))) {
    exec(path.join(getLocalPath("ytm-dlp"), "ffmpeg/ffmpeg"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffmpeg version')) {
        throwErr('FFMpeg executable error')
    
        ffbinaries.downloadBinaries(['ffmpeg'], { destination: path.join(getLocalPath("ytm-dlp"), "ffmpeg") }, (err) => { if (err) { throwErr(err) } })
      }
    })

    exec(path.join(getLocalPath("ytm-dlp"), "ffmpeg/ffprobe"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffprobe version')) {
        throwErr('FFProbe executable error')

        ffbinaries.downloadBinaries(['ffprobe'], { destination: path.join(getLocalPath("ytm-dlp"), "ffmpeg") }, (err) => { if (err) { throwErr(err) } })
      }
    })
  }
}

module.exports = {
  default: getDeps
}