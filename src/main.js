/* Modules */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const { updateElectronApp } = require('update-electron-app')
const YTDlpWrap = require('yt-dlp-wrap').default
const getLyrics = require('lyrics-snatcher')
const fetch = require('node-fetch-commonjs')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const { throwErr, logStream } = require('./modules/throw-err')
const getLocalPath = require("./modules/local-path").default
const getStyles = require('./modules/get-styles').default
const getLang = require('./modules/get-lang').default
const getDeps = require('./modules/get-deps').default

const YtDlpWrap = new YTDlpWrap(path.join(getLocalPath("ytm-dlp"), 'yt-dlp/yt-dlp' + (os.platform() === 'win32' ? '.exe' : '')))

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
/* DO NOT CHANGE */


/* Initialisation */
if (require('electron-squirrel-startup')) return
updateElectronApp()

app.whenReady().then(async () => {
  app.on('window-all-closed', () => {
    logStream.end(`[info] Log end.`)
    app.quit()
  })

  // Window creation
  ipcMain.on('getArt', createUrl)
  ipcMain.on('openAbout', createAbout)
  ipcMain.on('openProxy', createProxy)
  ipcMain.on('clickedSettings', createSettings)
  ipcMain.on('chooseDirectory', () => {
    dialog.showOpenDialog(MainWin, {
      title: language.seldlfolder,
      buttonLabel: language.select,
      properties: ['openDirectory']
    }).then((e) => { if (!e.canceled) { MainWin.webContents.send('sendDirectory', e.filePaths[0]) } })
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

  // Data receiving
  ipcMain.handle('getStyles', getStyles)
  ipcMain.handle('getLanguage', () => { return language })
  ipcMain.on('recieveMetadata', (_event, metadata) => { changedMetadata = metadata })
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
      })
  })

  // Data reloading
  ipcMain.on('reloadMetadata', () => { SetWin.webContents.send('sendMetadata', metadata); customArt = null })
  ipcMain.on('changeStyle', (_event, style) => {
    let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8'))
    config.style = style

    fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), JSON.stringify(config))

    MainWin.reload()
    AboutWin.reload()
  })
  ipcMain.on('resetDeps', async () => {
    fs.rmSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp"), { recursive: true, force: true })
    fs.rmSync(path.join(getLocalPath("ytm-dlp"), "ffmpeg"), { recursive: true, force: true })

    await getDeps()
  })
  ipcMain.on('clearCache', () => {
    if (fs.existsSync(path.join(os.homedir(), '.ffbinaries-cache'))) fs.rmSync(path.join(os.homedir(), '.ffbinaries-cache'), { recursive: true, force: true })
  })
  ipcMain.on('updateProxy', (_event, new_proxy) => { 
    let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8'))
    config.proxy = new_proxy.enable
    config.proto = new_proxy.proto
    config.host = new_proxy.host
    config.port = new_proxy.port

    fs.writeFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), JSON.stringify(config))
  
    proxy = new_proxy
  })

  // Start downloading
  ipcMain.on('startDownload', startDownload)

  await getDeps()
  language = getLang()
  proxy = getProxy()
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
    let config = getProxy();  
    (proxy.enable) ? ProxyWin.webContents.send('sendProxy', config) : ''
    ProxyWin.show(); 
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

  rawMetadata = await YtDlpWrap.getVideoInfo([videoURL, (proxy.enable) ? '--proxy' : '', (proxy.enable) ? `${proxy.proto}://${proxy.host}:${proxy.port}` : ''])

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

const getProxy = () => {
  let config = JSON.parse(fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "config.json"), 'utf-8'))

  let proxy = { enable: false }

  if (config.host) {
    proxy = {
      enable: config.proxy,
      proto: config.proto,
      host: config.host,
      port: config.port
    }
  }

  return proxy
}

const startDownload = async (_event, videoURL, dirPath, ext, order) => {
  let args = fs.readFileSync(path.join(getLocalPath("ytm-dlp"), "yt-dlp/arguments.list"), 'UTF-8').split(/\n/).map(e => { return e.replace(/"/g, '') })

  if (Object.keys(changedMetadata).length !== 0) {
    for (let i = 0; i < 12; i++) {
      args.pop()
    }

    if (customArt) {
      args.push(
        '--ppa', `ThumbnailsConvertor+ffmpeg_i: -i '${customArt}'`
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
          args.push("")
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

  args.unshift(
    '-o', `${fs.existsSync(dirPath) ? dirPath : os.homedir()}${os.platform === "win32" ? "\\" : '/'}%(artist,uploader)s - %(title,meta_title)s.%(ext)s`
  )

  if (order === 'strict') {
    args.push(
      '--parse-metadata', "playlist_index:%(track_number)s"
    )
  }

  args.push(
    '--audio-format', ext,
    (proxy.enable) ? '--proxy' : '', (proxy.enable) ? `${proxy.proto}://${proxy.host}:${proxy.port}` : '',
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
