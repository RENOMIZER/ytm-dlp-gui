/* Modules */
const { app, ipcMain, dialog } = require('electron')
const { updateElectronApp } = require('update-electron-app')
const YTDlpWrap = require('yt-dlp-wrap').default
const getLyrics = require('lyrics-snatcher')
const fetch = require('node-fetch-commonjs')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const { logStream, throwErr } = require('./modules/throw-err')
const WindowManager = require('./modules/window-manager').default
const AssetsManager = require('./modules/assets-manager').default
const AssetsGetter = require('./modules/assets-getter').default
const getLocalPath = require("./modules/local-path").default

const localPath = getLocalPath("ytm-dlp")
const configPath = path.join(localPath, "config.json")

const YtDlpWrap = new YTDlpWrap(path.join(localPath, "yt-dlp", "yt-dlp" + (os.platform() === 'win32' ? '.exe' : '')))
const Getter = new AssetsGetter();
const Manager = new AssetsManager();
const Windows = new WindowManager(Getter.getStyles().currentStyleText);

let metadata = {}, changedMetadata = {}
let currentVideo, rawMetadata, customArt

/* Initialisation */
if (require('electron-squirrel-startup')) return
updateElectronApp()

let language = Getter.getLanguage()
let proxy = Getter.getProxy()

Windows.setLanguage(language)

app.whenReady().then(async () => {
  ipcMain.handle('getStyles', () => { return Getter.getStyles() })
  // ipcMain.handle('getLanguage', () => { return language })

  for (const [channel, listener] of Object.entries({
    // Window creation
    openUrl: () => { Windows.createUrl() },
    openAbout: () => { Windows.createAbout() },
    openProxy: () => { Windows.createProxy(Getter.getProxy()) },
    openEdit: (_event, videoURL) => { Windows.createEdit(), dlMetadata(videoURL) },
    chooseDirectory: () => {
      dialog.showOpenDialog(Windows.main, {
        title: language.seldlfolder,
        buttonLabel: language.select,
        properties: ['openDirectory']
      }).then((e) => { if (!e.canceled) { Windows.send(Windows.main, 'sendDirectory', e.filePaths[0]) } })
    },
    openArt: () => {
      dialog.showOpenDialog(Windows.edit, {
        title: language.selalbumart,
        buttonLabel: language.select,
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
        ],
        properties: ['openFile']
      }).then((e) => { if (!e.canceled) { Windows.send(Windows.edit, 'sendArt', e.filePaths[0]); customArt = e.filePaths[0] } })
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

          Windows.send(Windows.edit, 'sendArt', path.join(os.tmpdir(), "ytm-dlp-images", "art"))
          customArt = path.join(os.tmpdir(), "ytm-dlp-images", "art")
        })
        .catch((err) => {
          throwErr(err)
        })
    },

    // Data reloading
    reloadMetadata: () => { Windows.send(Windows.edit, 'sendMetadata', metadata); customArt = null },
    changeStyle: (_event, style) => {
      let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      if (config.style !== style) {
        fs.writeFileSync(configPath, JSON.stringify({ ...config, ...{ style: style } }))

        Windows.setStyle(Getter.getStyles().currentStyleText)
      }
    },
    resetDeps: async () => {
      fs.rmSync(path.join(localPath, "yt-dlp"), { recursive: true, force: true })
      fs.rmSync(path.join(localPath, "ffmpeg"), { recursive: true, force: true })

      Manager.setupAll()
    },
    clearCache: () => {
      if (fs.existsSync(path.join(os.homedir(), '.ffbinaries-cache'))) fs.rmSync(path.join(os.homedir(), '.ffbinaries-cache'), { recursive: true, force: true })
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

  Windows.createMain()

  app.on('window-all-closed', () => {
    logStream.end(`[info] Log end.`)
    app.quit()
  })
})

/* Funcitions */
const dlMetadata = async (videoURL) => {
  if (videoURL === currentVideo) {
    Windows.edit.webContents.once("dom-ready", () => Windows.send(Windows.edit, 'sendMetadata', ((Object.keys(changedMetadata).length === 0) ? metadata : changedMetadata)))
    return 0;
  }

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
  currentVideo = videoURL

  Windows.send(Windows.edit, 'sendMetadata', metadata)
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
  if (proxy.proxy) args.push('--proxy', `${proxy.proto}://${proxy.host}:${proxy.port}`)

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
        Windows.send(Windows.main, 'sendProgress', eData.slice(1, 4))
      }
    })
    .on('error', (err) => { Windows.send(Windows.main, 'sendDownloadError'); throwErr(err) })
    .on('close', () => {
      logStream.write('\n')

      Windows.send(Windows.main, 'sendDownloadFinished')
      if (fs.existsSync(path.join(os.tmpdir(), '/ytm-dlp-images/art'))) {
        fs.unlink(path.join(os.tmpdir(), '/ytm-dlp-images/art'), (err) => { if (err) { throwErr(err) } })
      }
    })

  currentVideo = ''
  changedMetadata = {}
}
