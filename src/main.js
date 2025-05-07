/* Modules */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const { updateElectronApp } = require('update-electron-app')
const YTDlpWrap = require('yt-dlp-wrap').default
const getLyrics = require('lyrics-snatcher')
const fetch = require('node-fetch-commonjs')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const { logStream, throwErr } = require('./modules/throw-err')
const AssetsManager = require('./modules/assets-manager').default
const AssetsGetter = require('./modules/assets-getter').default
const getLocalPath = require("./modules/local-path").default

const YtDlpWrap = new YTDlpWrap(path.join(getLocalPath("ytm-dlp"), 'yt-dlp/yt-dlp' + (os.platform() === 'win32' ? '.exe' : '')))
const Getter = new AssetsGetter();
const Manager = new AssetsManager();

let proxy = {}
let metadata = {}
let changedMetadata = {}
let currentVideo
let rawMetadata
let customArt
let language


/* DO NOT CHANGE */
let MainWin
let SetWin
let UrlWin
let AboutWin
let ProxyWin
/* DO NOT CHANGE */


/* Initialisation */
if (require('electron-squirrel-startup')) return
updateElectronApp()

app.whenReady().then(async () => {
  app.on('window-all-closed', () => {
    logStream.end(`[info] Log end.`)
    app.quit()
  })

  ipcMain.handle('getStyles', () => { return Getter.getStyles() })
  ipcMain.handle('getLanguage', () => { return language })

  for (const [channel, listener] of Object.entries({
    // Window creation
    getArt: createUrl,
    openAbout: createAbout,
    openProxy: createProxy,
    clickedSettings: createSettings,
    chooseDirectory: () => {
      dialog.showOpenDialog(MainWin, {
        title: language.seldlfolder,
        buttonLabel: language.select,
        properties: ['openDirectory']
      }).then((e) => { if (!e.canceled) { MainWin.webContents.send('sendDirectory', e.filePaths[0]) } })
    },
    openArt: () => {
      dialog.showOpenDialog(SetWin, {
        title: language.selalbumart,
        buttonLabel: language.select,
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
        ],
        properties: ['openFile']
      }).then((e) => { if (!e.canceled) { SetWin.webContents.send('sendArt', e.filePaths[0]); customArt = e.filePaths[0] } })
    },

    // Data receiving
    recieveMetadata: (_event, metadata) => { changedMetadata = metadata },
    recieveLanguage: (_event, lang) => {
      if (lang !== language.current) {
        let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json")))
        config.lang = lang

        fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), JSON.stringify(config))

        app.relaunch()
        app.quit()
      }
    },
    receiveOnlineArt: (_event, artURL) => {
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
        })
    },

    // Data reloading
    reloadMetadata: () => { SetWin.webContents.send('sendMetadata', metadata); customArt = null },
    changeStyle: (_event, style) => {
      let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8'))
      config.style = style

      fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), JSON.stringify(config))

      MainWin.reload()
      AboutWin.reload()
    },
    resetDeps: async () => {
      fs.rmSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp"), { recursive: true, force: true })
      fs.rmSync(path.join(getLocalPath("ytm-dlp"), "ffmpeg"), { recursive: true, force: true })

      Manager.setupAll()
    },
    clearCache: () => {
      if (fs.existsSync(path.join(os.homedir(), '.ffbinaries-cache'))) fs.rmSync(path.join(os.homedir(), '.ffbinaries-cache'), { recursive: true, force: true })
    },
    updateProxy: (_event, new_proxy) => {
      let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8'))
      config.proxy = new_proxy.enable
      config.proto = new_proxy.proto
      config.host = new_proxy.host
      config.port = new_proxy.port

      fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), JSON.stringify(config))

      proxy = new_proxy
    },

    // Start downloading
    startDownload: startDownload
  })) {
    ipcMain.on(channel, listener)
  }

  language = Getter.getLanguage();
  proxy = Getter.getProxy()

  createMain()
})

/* Funcitions */
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
      preload: path.join(__dirname, 'preload.js')
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
      preload: path.join(__dirname, 'preload.js')
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
      preload: path.join(__dirname, 'preload.js')
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
      preload: path.join(__dirname, 'preload.js')
    }
  })

  AboutWin.removeMenu()
  AboutWin.loadFile('src/screens/about.html')
  AboutWin.on('ready-to-show', () => { AboutWin.show() })
  AboutWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

const createProxy = () => {
  ProxyWin = new BrowserWindow({
    width: 450,
    height: 450,
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
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // ProxyWin.removeMenu()
  ProxyWin.loadFile('src/screens/proxy.html')
  ProxyWin.on('ready-to-show', () => {
    let config = Getter.getProxy()
    if (config.host) ProxyWin.webContents.send('sendProxy', config)
    ProxyWin.show()
  })
  ProxyWin.on('minimize', () => { MainWin.minimize() })
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

  if (proxy.enable) {
    rawMetadata = await YtDlpWrap.getVideoInfo([videoURL, '--proxy', `${proxy.proto}://${proxy.host}:${proxy.port}`])
  }
  else {
    rawMetadata = await YtDlpWrap.getVideoInfo(videoURL)
  }

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
  metadata.art = rawMetadata.thumbnails.pop().url
  currentVideo = videoURL

  SetWin.webContents.send('sendMetadata', metadata)
}

const startDownload = async (_event, videoURL, dirPath, ext, order) => {
  let args = fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp/arguments"), 'UTF-8').split(/\n/).map(e => { return e.replace(/"/g, '') })

  if (Object.keys(changedMetadata).length !== 0) {
    args.splice(-12)

    if (customArt) {
      args.push('--ppa', `ThumbnailsConvertor+ffmpeg_i: -i '${customArt}'`)

      customArt = null
    }

    if (changedMetadata.lyrics !== 'none' && ext !== 'mp3') {
      let lrc = await getLyrics(changedMetadata.track, changedMetadata.artist.replace(/(,[a-zа-яА-ЯA-Z0-9_ ]).*/g, ''), changedMetadata.album, `${rawMetadata.duration}`)
      if (lrc.plain === null) {
        lrc = await getLyrics(changedMetadata.track, changedMetadata.artist.replace(/(,[a-zа-яА-ЯA-Z0-9_ ]).*/g, ''), ' ', `${rawMetadata.duration}`)
      }

      if (lrc instanceof Error) throwErr(lrc)

      else {
        args.push(
          "--parse-metadata", "NA:(?P<meta_lyrics>.*)",
          "--replace-in-metadata", "meta_lyrics", "NA"
        )

        if (changedMetadata.lyrics === 'sync' && lrc.synced !== null) {
          args.push(lrc.synced)
        }
        else if (lrc.plain !== null) {
          args.push(lrc.plain)
        }
        else {
          args.splice(-5)
        }
      }
    }

    let data = {
      'meta_title': 'track',
      'title': 'track',
      'meta_artist': 'artist',
      'artist': 'artist',
      'uploader': 'artist',
      'album_artist': 'album_artist',
      'meta_album': 'album',
      'meta_date': 'upload_year',
      'genre': 'genre'
    }

    for (const [key, value] of Object.entries(data)) {
      args.push(
        '--parse-metadata', `NA:%(${key})s`,
        '--replace-in-metadata', key, 'NA', changedMetadata[value]
      )
    }
  }

  args.unshift('-o', path.join(fs.existsSync(dirPath) ? dirPath : os.homedir(), '%(artist,uploader)s - %(title,meta_title)s.%(ext)s'))

  if (order === 'strict') args.push('--parse-metadata', "playlist_index:%(track_number)s")
  if (proxy.enable) args.push('--proxy', `${proxy.proto}://${proxy.host}:${proxy.port}`)

  args.push(
    '--audio-format', ext,
    videoURL
  )

  console.log(args)

  YtDlpWrap.exec(args)
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

      MainWin.webContents.send('sendDownloadFinished')
      if (fs.existsSync(path.join(os.tmpdir(), '/ytm-dlp-images/art'))) {
        fs.unlink(path.join(os.tmpdir(), '/ytm-dlp-images/art'), (err) => { if (err) { throwErr(err) } })
      }
    })

  currentVideo = ''
  changedMetadata = {}
}
