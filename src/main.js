/* NPM Modules */
const { app, ipcMain, dialog } = require('electron')
const { updateElectronApp } = require('update-electron-app')
const YTDlpWrap = require('yt-dlp-wrap').default
const getLyrics = require('lyrics-snatcher')
const fetch = require('node-fetch-commonjs')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

/* Local Modules */
const LogManager = require('./modules/log-manager').default
const WindowManager = require('./modules/window-manager').default
const AssetsManager = require('./modules/assets-manager').default
const getLocalPath = require("./modules/local-path").default

/* Constants */
const localPath = getLocalPath("ytm-dlp")
const configPath = path.join(localPath, "config.json")

/* Classes */
const YtDlpWrap = new YTDlpWrap(path.join(localPath, "yt-dlp", "yt-dlp" + (os.platform() === 'win32' ? '.exe' : '')))
const logger = new LogManager();
const manager = new AssetsManager(logger);
const windows = new WindowManager(manager.getStyles().currentStyleText);

/* Globals */
let metadata = {}, changedMetadata = {}
let currentVideo, customArt

/* Initialization */
if (require('electron-squirrel-startup')) return
updateElectronApp()

let language = manager.getLanguage()
let proxy = manager.getProxy()

windows.setLanguage(language)

app.whenReady().then(async () => {
  ipcMain.handle('getStyles', () => { return manager.getStyles() })

  for (const [channel, listener] of Object.entries({
    // Window creation
    openUrl: () => { windows.createUrl() },
    openAbout: () => { windows.createAbout() },
    openProxy: () => { windows.createProxy(manager.getProxy()) },
    openEdit: (_event, videoURL) => { windows.createEdit(), dlMetadata(videoURL) },
    chooseDirectory: () => {
      dialog.showOpenDialog(windows.main, {
        title: language.seldlfolder,
        buttonLabel: language.select,
        properties: ['openDirectory']
      }).then((e) => { if (!e.canceled) { windows.send(windows.main, 'sendDirectory', e.filePaths[0]) } })
    },
    openArt: () => {
      dialog.showOpenDialog(windows.edit, {
        title: language.selalbumart,
        buttonLabel: language.select,
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
        ],
        properties: ['openFile']
      }).then((e) => { if (!e.canceled) { customArt = e.filePaths[0]; windows.send(windows.edit, 'sendArt', customArt) } })
    },

    // Data receiving
    recieveMetadata: (_event, metadata) => { changedMetadata = metadata },
    recieveLanguage: (_event, lang) => {
      if (lang !== language.current) {
        let config = JSON.parse(fs.readFileSync(configPath))
        config.lang = lang

        fs.writeFileSync(configPath, JSON.stringify(config))

        app.relaunch()
        app.quit()
      }
    },
    receiveOnlineArt: (_event, artURL) => {
      fetch(artURL)
        .then((response) => response.buffer())
        .then((buffer) => {
          if (!fs.existsSync(path.join(os.tmpdir(), "ytm-dlp-images"))) { fs.mkdirSync(path.join(os.tmpdir(), "ytm-dlp-images")) }

          fs.writeFileSync(path.join(os.tmpdir(), "ytm-dlp-images", "art"), buffer)

          windows.send(windows.edit, 'sendArt', path.join(os.tmpdir(), "ytm-dlp-images", "art"))
          customArt = path.join(os.tmpdir(), "ytm-dlp-images", "art")
        })
        .catch((err) => {
          logger.throwErr(err)
        })
    },

    // Data reloading
    reloadMetadata: () => { windows.send(windows.edit, 'sendMetadata', metadata); customArt = null },
    changeStyle: (_event, style) => {
      let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      if (config.style !== style) {
        fs.writeFileSync(configPath, JSON.stringify({ ...config, ...{ style: style } }))

        windows.setStyle(manager.getStyles().currentStyleText)
      }
    },
    resetDeps: async () => {
      fs.rmSync(path.join(localPath, "yt-dlp"), { recursive: true, force: true })
      fs.rmSync(path.join(localPath, "ffmpeg"), { recursive: true, force: true })

      manager.setupAll(true)
    },
    clearCache: () => {
      logger.logMessage('info', 'Clearing ffsuite cache')
      if (fs.existsSync(path.join(os.homedir(), '.ffbinaries-cache'))) fs.rmSync(path.join(os.homedir(), '.ffbinaries-cache'), { recursive: true, force: true })
      if (fs.existsSync(path.join(os.homedir(), '.ffbinaries-cache'))) logger.logMessage('error', 'Coundn\'t clear ffsuite cache')
      else logger.logMessage('info', 'FFsuite cache successfuly cleared')
    },
    updateProxy: (_event, newConfig) => {
      let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

      fs.writeFileSync(configPath, JSON.stringify({ ...config, ...newConfig }))

      proxy = newConfig
    },
    getLanguage: (event) => {
      event.returnValue = language
    },

    // Start downloading
    startDownload
  })) {
    ipcMain.on(channel, listener)
  }

  windows.createMain()

  app.on('window-all-closed', () => {
    logger.endLog()
    app.quit()
  })
})

/* Functions */
const dlMetadata = async (videoURL) => {
  if (videoURL === currentVideo) {
    windows.edit.webContents.once("dom-ready", () => windows.send(windows.edit, 'sendMetadata', ((Object.keys(changedMetadata).length === 0) ? metadata : changedMetadata)))
    return 0;
  }

  let rawMetadata = {}

  if (proxy.proxy) {
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
  metadata.duration = rawMetadata.duration
  currentVideo = videoURL

  windows.send(windows.edit, 'sendMetadata', metadata)
}

const startDownload = async (_event, videoURL, dirPath, ext, order) => {
  let args = fs.readFileSync(path.join(localPath, "yt-dlp/arguments"), 'UTF-8').split(/\n/).map(e => { return e.replace(/"/g, '') })

  if (Object.keys(changedMetadata).length !== 0) {
    args.splice(-12)

    if (customArt) {
      args.push('--ppa', `ThumbnailsConvertor+ffmpeg_i: -i '${customArt}'`)

      customArt = null
    }

    if (changedMetadata.lyrics !== 'none' && ext !== 'mp3') {
      let lrc = await getLyrics(changedMetadata.track, changedMetadata.artist.replace(/(,[a-zа-яА-ЯA-Z0-9_ ]).*/g, ''), changedMetadata.album, `${metadata.duration}`)
      if (lrc.plain === null) {
        lrc = await getLyrics(changedMetadata.track, changedMetadata.artist.replace(/(,[a-zа-яА-ЯA-Z0-9_ ]).*/g, ''), ' ', `${metadata.duration}`)
      }

      if (lrc instanceof Error) logger.throwErr(lrc)

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
  if (proxy.proxy) args.push('--proxy', `${proxy.proto}://${proxy.host}:${proxy.port}`)

  args.push(
    '--audio-format', ext,
    videoURL
  )

  console.log(args)

  YtDlpWrap.exec(args)
    .on('ytDlpEvent', (eType, eData) => {
      console.log('[' + eType + ']', eData)
      logger.logMessage(eType, eData)

      if (eType === 'download' && eData.slice(1, 4) !== 'Des' && eData.slice(4, 5) === '.') {
        windows.send(windows.main, 'sendProgress', eData.slice(1, 4))
      }
    })
    .on('error', (err) => { windows.send(windows.main, 'sendDownloadError'); logger.throwErr(err) })
    .on('close', () => {
      windows.send(windows.main, 'sendDownloadFinished')
      if (fs.existsSync(path.join(os.tmpdir(), '/ytm-dlp-images/art'))) {
        fs.unlink(path.join(os.tmpdir(), '/ytm-dlp-images/art'), (err) => { if (err) { logger.throwErr(err) } })
      }
    })

  currentVideo = ''
  changedMetadata = {}
}
