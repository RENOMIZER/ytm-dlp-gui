/* Modules */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const getLocalPath = require("./local-path").default;
const YTDlpWrap = require('yt-dlp-wrap').default;
const ffbinaries = require('ffbinaries-plus');
const fetch = require("node-fetch-commonjs");
const getLyrics = require('lyrics-snatcher');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/* Classes */
const YtDlpWrap = new YTDlpWrap(path.join(getLocalPath("ytm-dlp"), 'yt-dlp/yt-dlp' + (os.platform() === 'win32' ? '.exe' : '')));
Date.prototype.dateNow = function () {
  return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "-" + this.getMonth() + 1 + "-" + this.getFullYear();
}
Date.prototype.timeNow = function () {
  return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
}
const date = new Date()

/* DO NOT CHANGE */
let MainWin
let SetWin
let UrlWin
/* DO NOT CHANGE */

/* Variables */
let changedMetadata = {}
let metadata = {}
let rawMetadata
let currentVideo
let customArt
let language

/* Initialisation */
if (require('electron-squirrel-startup')) return;

let logStream = fs.createWriteStream(path.join(os.tmpdir(), `ytm-dlp-log-${date.dateNow()}-${date.timeNow()}.log`))

/* Main cycle */
app.whenReady().then(async () => {
  ipcMain.on('getArt', createUrl)
  ipcMain.on('openAbout', createAbout)
  ipcMain.on('clickedSettings', createSettings)
  ipcMain.on('startDownload', startDownload)
  ipcMain.handle('getStyles', getStyles)

  ipcMain.handle('getLanguage', () => { return language })
  ipcMain.on('recieveMetadata', (_event, metadata) => { changedMetadata = metadata })
  ipcMain.on('reloadMetadata', () => { SetWin.webContents.send('sendMetadata', metadata); customArt = null })

  ipcMain.on('chooseDirectory', () => {
    dialog.showOpenDialog(MainWin, {
      title: language.seldlfolder,
      buttonLabel: language.select,
      properties: ['openDirectory']
    }).then((e) => { if (!e.canceled) { MainWin.webContents.send('sendDirectory', e.filePaths[0]) } })
  })

  ipcMain.on('resetDeps', async () => {
    fs.rmSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp"), { recursive: true, force: true })
    fs.rmSync(path.join(getLocalPath("ytm-dlp"), "ffmpeg"), { recursive: true, force: true })

    await getDeps()
  })

  ipcMain.on('changeStyle', (_event, style) => {
    let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8'))
    config.style = style

    fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), JSON.stringify(config))

    MainWin.reload()
    AboutWin.reload()
  })

  ipcMain.on('recieveLanguage', (_event, lang) => {
    if (lang !== language.current) {
      let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json")))
      config.lang = lang

      fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), JSON.stringify(config))

      app.relaunch()
      app.quit()
    }
  })

  ipcMain.on('receiveOnlineArt', (_event, artURL) => {
    fetch(artURL)
      .then((response) => response.buffer())
      .then((buffer) => {
        if (!fs.existsSync(path.join(os.tmpdir(), '/ytm-dlp-images/'))) { fs.mkdirSync(path.join(os.tmpdir(), '/ytm-dlp-images/')) }

        fs.writeFileSync(path.join(os.tmpdir(), '/ytm-dlp-images/art'), buffer)

        SetWin.webContents.send('sendArt', path.join(os.tmpdir(), '/ytm-dlp-images/art'))
        customArt = path.join(os.tmpdir(), '/ytm-dlp-images/art')
      })
      .catch((err) => {
        throwErr(err)
      });
  })

  ipcMain.on('openArt', () => {
    dialog.showOpenDialog(SetWin, {
      title: language.selalbumart,
      buttonLabel: language.select,
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
      ],
      properties: ['openFile']
    }).then((e) => { if (!e.canceled) { SetWin.webContents.send('sendArt', e.filePaths[0]); customArt = e.filePaths[0] } })
  })

  await getDeps()
  getLang()
  createMain()

  app.on('window-all-closed', () => {
    logStream.end(`[info] Log end.`)
    app.quit()
  })
})

/* Window creation */
const createMain = () => {
  MainWin = new BrowserWindow({
    width: 800,
    minWidth: 400,
    height: 600,
    minHeight: 300,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    menuBarVisible: false,
    show: false,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '/preload.js')
    }
  })

  MainWin.removeMenu()
  MainWin.loadFile('src/screens/index.html')
  MainWin.on('ready-to-show', () => { MainWin.show() })
}

const createSettings = (_event, videoURL) => {
  SetWin = new BrowserWindow({
    width: 600,
    height: 800,
    resizable: false,
    title: language.edit,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    parent: MainWin,
    modal: true,
    show: false,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '/preload.js')
    }
  })

  SetWin.removeMenu()
  SetWin.loadFile('src/screens/settings.html')
  SetWin.on('ready-to-show', () => { SetWin.show(); getMetadata(videoURL) })
  SetWin.on('minimize', () => { MainWin.minimize() })
}

const createUrl = () => {
  UrlWin = new BrowserWindow({
    width: 450,
    height: 150,
    resizable: false,
    title: language.url,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    parent: SetWin,
    modal: true,
    show: false,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '/preload.js')
    }
  })

  UrlWin.removeMenu()
  UrlWin.loadFile('src/screens/url.html')
  UrlWin.on('ready-to-show', () => { UrlWin.show() })
}

const createAbout = () => {
  AboutWin = new BrowserWindow({
    width: 450,
    height: 600,
    resizable: false,
    title: language.about,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#707070',
      height: 45,
    },
    parent: MainWin,
    modal: true,
    show: false,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '/preload.js')
    }
  })

  AboutWin.removeMenu()
  AboutWin.loadFile('src/screens/about.html')
  AboutWin.on('ready-to-show', () => { AboutWin.show() })
  AboutWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  })
}

/* Get info */
const getLang = () => {
  if (!fs.existsSync(path.join(getLocalPath("ytm-dlp"), "config.json")) || fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8') === '') {
    fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), `{"lang": "en", "style": "mocha"}`)
  }

  let local = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json")))
  language = JSON.parse(fs.readFileSync(path.join(__dirname, '/lang/', local.lang + '.json')))
}

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

const getMetadata = async (videoURL) => {
  if (videoURL === currentVideo && Object.keys(changedMetadata).length === 0) {
    SetWin.webContents.send('sendMetadata', metadata)
    return
  }
  else if (Object.keys(changedMetadata).length !== 0) {
    SetWin.webContents.send('sendMetadata', changedMetadata)
    return
  }

  rawMetadata = await YtDlpWrap.getVideoInfo(videoURL)

  if (rawMetadata.artist) {
    metadata.track = rawMetadata.track
    metadata.artist = rawMetadata.artist
    metadata.album = rawMetadata.album
    metadata.upload_year = rawMetadata.description.match(/(?<=Released on: )[0-9]{4}/gm) ? rawMetadata.description.match(/(?<=Released on: )[0-9]{4}/gm) : rawMetadata.description.match(/(?<=℗ )[0-9]{4}/gm)
    metadata.album_artist = rawMetadata.album_artist ? rawMetadata.album_artist : rawMetadata.artist
  }
  else {
    metadata.track = rawMetadata.title
    metadata.artist = rawMetadata.uploader
    metadata.album = ""
    metadata.upload_year = rawMetadata.upload_date.match(/^\d{4}/gm)
    metadata.album_artist = rawMetadata.album_artist ? rawMetadata.album_artist : rawMetadata.uploader
  }

  metadata.genre = rawMetadata.genre ? rawMetadata.genre : ""
  metadata.art = rawMetadata['thumbnails'].pop()['url']
  currentVideo = videoURL

  SetWin.webContents.send('sendMetadata', metadata)
}

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

  ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], { destination: path.join(getLocalPath("ytm-dlp"), "ffmpeg") }, (err) => {
    if (err) { throwErr(err) }

    exec(path.join(getLocalPath("ytm-dlp"), "ffmpeg/ffmpeg"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffmpeg version')) {
        throwErr('FFMpeg executable error')

        fs.unlinkSync(path.join(getLocalPath("ytm-dlp"), "ffmpeg/ffmpeg" + (os.platform() === 'win32' ? '.exe' : '')))

        ffbinaries.downloadBinaries(['ffmpeg'], { destination: path.join(getLocalPath("ytm-dlp"), "ffmpeg") }, (err) => { if (err) { throwErr(err) } })
      }
    })

    exec(path.join(getLocalPath("ytm-dlp"), "ffmpeg/ffprobe"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffprobe version')) {
        throwErr('FFProbe executable error')

        fs.unlinkSync(path.join(getLocalPath("ytm-dlp"), "ffmpeg/ffprobe" + (os.platform() === 'win32' ? '.exe' : '')))

        ffbinaries.downloadBinaries(['ffprobe'], { destination: path.join(getLocalPath("ytm-dlp"), "ffmpeg") }, (err) => { if (err) { throwErr(err) } })
      }
    })
  })
}

/* General functions */
const startDownload = async (_event, videoURL, dirPath, ext, order) => {
  let arguments = fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp/arguments.list"), 'UTF-8').split(/\n/).map(e => { return e.replace(/"/g, '') })

  if (Object.keys(changedMetadata).length !== 0) {
    for (let i = 0; i < 12; i++) {
      arguments.pop()
    }

    if (customArt) {
      arguments.push(
        '--ppa', `ThumbnailsConvertor+ffmpeg_i: -i '${customArt}'`,
      )

      customArt = null
    }

    if (changedMetadata.lyrics !== 'none' && ext !== 'mp3') {
      let lrc = await getLyrics(changedMetadata.track, changedMetadata.artist.replace(/(,[a-zа-яА-ЯA-Z0-9_ ]).*/g, ''), changedMetadata.album, `${rawMetadata.duration}`)
      if (lrc.plain === null) {
        lrc = await getLyrics(changedMetadata.track, changedMetadata.artist.replace(/(,[a-zа-яА-ЯA-Z0-9_ ]).*/g, ''), ' ', `${rawMetadata.duration}`)
      }

      if (lrc instanceof Error) {
        throwErr(lrc)
      }
      else {
        arguments.push(
          "--parse-metadata", "NA:(?P<meta_lyrics>.*)",
          "--replace-in-metadata", "meta_lyrics", "NA"
        )

        if (changedMetadata.lyrics === 'sync' && lrc.synced !== null) {
          arguments.push(lrc.synced)
        }
        else if (lrc.plain !== null) {
          arguments.push(lrc.plain)
        }
        else {
          arguments.push("")
        }
      }
    }

    arguments.push(
      '--parse-metadata', "NA:%(meta_title)s",
      '--parse-metadata', "NA:%(title)s",
      '--parse-metadata', "NA:%(meta_artist)s",
      '--parse-metadata', "NA:%(artist)s",
      '--parse-metadata', "NA:%(uploader)s",
      '--parse-metadata', "NA:%(album_artist)s",
      '--parse-metadata', "NA:%(meta_album)s",
      '--parse-metadata', "NA:%(meta_date)s",
      '--parse-metadata', "NA:%(genre)s",

      '--replace-in-metadata', 'meta_title', 'NA', changedMetadata.track,
      '--replace-in-metadata', 'title', 'NA', changedMetadata.track,
      '--replace-in-metadata', 'meta_artist', 'NA', changedMetadata.artist,
      '--replace-in-metadata', 'artist', 'NA', changedMetadata.artist,
      '--replace-in-metadata', 'uploader', 'NA', changedMetadata.artist,
      '--replace-in-metadata', 'album_artist', 'NA', changedMetadata.album_artist,
      '--replace-in-metadata', 'meta_album', 'NA', changedMetadata.album,
      '--replace-in-metadata', 'meta_date', 'NA', changedMetadata.upload_year,
      '--replace-in-metadata', 'genre', 'NA', changedMetadata.genre
    )
  }

  if (fs.existsSync(dirPath)) {
    for (let i = 0; i < 2; i++) {
      arguments.shift()
    }

    arguments.unshift(
      '-o', `${dirPath}/%(artist,uploader)s - %(title,meta_title)s.%(ext)s`
    )
  }

  if (order === 'strict') {
    arguments.push(
      '--parse-metadata', "playlist_index:%(track_number)s",
    )
  }

  arguments.push(
    '--audio-format', ext,
    videoURL
  )

  YtDlpWrap.exec(arguments)
    .on('ytDlpEvent', (eType, eData) => {
      console.log('[' + eType + ']', eData)
      logStream.write(`[${eType}] ${eData}\n`)

      if (eType === 'download' && eData.slice(1, 4) !== 'Des' && eData.slice(4, 5) === '.') {
        MainWin.webContents.send('sendProgress', eData.slice(1, 4))
      }
    })
    .on('error', (err) => { MainWin.webContents.send('sendDownloadError'); throwErr(err) })
    .on('close', () => {
      logStream.write('\n')

      MainWin.webContents.send('sendDownloadFinished');
      if (fs.existsSync(path.join(os.tmpdir(), '/ytm-dlp-images/art'))) {
        fs.unlink(path.join(os.tmpdir(), '/ytm-dlp-images/art'), (err) => { if (err) { throwErr(err) } })
      }
    })

  currentVideo = ''
  changedMetadata = {}
}

const throwErr = (err) => {
  console.error(err)
  logStream.write(`[error] ` + err + '\n\n')
}
