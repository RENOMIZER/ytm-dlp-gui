/* Modules */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fetch = require("electron-fetch").default;
const getAppDataPath = require("appdata-path");
const ffbinaries = require('ffbinaries');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/* Classes */
const YtDlpWrap = new YTDlpWrap(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"));

/* DO NOT CHANGE */
let MainWin
let SetWin
let UrlWin
/* DO NOT CHANGE */

/* Variables */
let changedMetadata = { "no": "data" }
let metadata = {}
let rawMetadata
let currentVideo
let customArt

/* Initialisation */
app.whenReady().then(() => {
  ipcMain.on('startDownload', startDownload)
  ipcMain.on('clickedSettings', createSettings)
  ipcMain.on('recieveMetadata', (_event, metadata) => { changedMetadata = metadata })
  ipcMain.on('receiveOnlineArt', artReceive)
  ipcMain.on('chooseDirectory', chooseDirectory)
  ipcMain.on('metadataReload', () => { SetWin.webContents.send('sendMetadata', metadata) })
  ipcMain.on('artOpen', artOpen)
  ipcMain.on('artGet', createUrl)

  getYTDlp()
  createWindow()
})

/* Listeners' functions */
const startDownload = (_event, videoURL, dirPath) => {
  let arguments = fs.readFileSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/arguments.txt"), 'UTF-8').split(/\n/).map(e => { return e.replace(/"/g, '') })

  if (!changedMetadata.no) {
    for (let i = 0; i < 6; i++) {
      arguments.pop()
    }

    if (customArt) {
      for (let i = 0; i < 2; i++) {
        arguments.pop()
      }

      arguments.push(
        '--ppa', `ThumbnailsConvertor+ffmpeg_i: -i '${customArt}'`,
        '--ppa', "ThumbnailsConvertor+ffmpeg_o: -map 0:0 -c:v png -vf crop='ih'"
      )

      customArt = null
    }

    arguments.push(
      '--parse-metadata', `${changedMetadata.track}:%(meta_title)s`,
      '--parse-metadata', `${changedMetadata.track}:%(title)s`,
      '--parse-metadata', `${changedMetadata.artist}:%(meta_artist)s`,
      '--parse-metadata', `${changedMetadata.artist}:%(artist)s`,
      '--parse-metadata', `${changedMetadata.album}:%(meta_album)s`,
      '--parse-metadata', `${changedMetadata.upload_year}:%(meta_date)s`,

      '--replace-in-metadata', 'meta_title', 'NA', changedMetadata.track,
      '--replace-in-metadata', 'title', 'NA', changedMetadata.track,
      '--replace-in-metadata', 'meta_artist', 'NA', changedMetadata.artist,
      '--replace-in-metadata', 'artist', 'NA', changedMetadata.artist,
      '--replace-in-metadata', 'meta_album', 'NA', changedMetadata.album,
      '--replace-in-metadata', 'meta_date', 'NA', changedMetadata.upload_year,
    )
  }

  if (path && fs.existsSync(dirPath)) {
    for (let i = 0; i < 2; i++) {
      arguments.shift()
    }

    arguments.unshift(
      '-o', `${dirPath}/%(artist)s - %(title)s.%(ext)s`
    )
  }

  if (changedMetadata.mp3) {
    arguments.unshift(
      '--audio-format', 'mp3',
      '--audio-quality', '0'
    )
  }

  arguments.push(videoURL)

  console.log(arguments)

  YtDlpWrap.exec(arguments)
    .on('error', (error) => { MainWin.webContents.send('sendDownloadError'); console.error(error) })
    .on('close', () => {
      MainWin.webContents.send('sendDownloadFinished');
      if (fs.existsSync(path.join(os.tmpdir(), '/ytm-dlp-images/art'))) {
        fs.unlink(path.join(os.tmpdir(), '/ytm-dlp-images/art'), (err) => { if (err) { console.error(err) } })
      }
    })

  currentVideo = ''
  changedMetadata = { "no": "data" }
}

const artOpen = () => {
  dialog.showOpenDialog(SetWin, {
    title: 'Select album artwork',
    buttonLabel: 'Select',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
    ],
    properties: ['openFile']
  }).then((e) => { if (!e.canceled) { SetWin.webContents.send('sendArt', e.filePaths[0]); customArt = e.filePaths[0] } })
}

const artReceive = (_event, artURL) => {
  fetch(artURL)
    .then((response) => response.buffer())
    .then((buffer) => {
      if (!fs.existsSync(path.join(os.tmpdir(), '/ytm-dlp-images/'))) { fs.mkdirSync(path.join(os.tmpdir(), '/ytm-dlp-images/')) }

      fs.writeFileSync(path.join(os.tmpdir(), '/ytm-dlp-images/art'), buffer)

      SetWin.webContents.send('sendArt', path.join(os.tmpdir(), '/ytm-dlp-images/art'))
      customArt = path.join(os.tmpdir(), '/ytm-dlp-images/art')
    })
    .catch((error) => {
      console.error(error);
    });
}

/* General functions */
const createWindow = () => {
  MainWin = new BrowserWindow({
    width: 800,
    minWidth: 400,
    height: 600,
    minHeight: 300,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#181825',
      symbolColor: '#bac2de',
      height: 45,
    },
    show: false,
    icon: path.join(__dirname, '/images/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '/scripts/preload.js')
    }
  })

  MainWin.loadFile('index.html')
  MainWin.on('ready-to-show', () => { MainWin.show() })
}

const createSettings = (_event, videoURL, type) => {
  SetWin = new BrowserWindow({
    width: 600,
    height: 800,
    resizable: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#181825',
      symbolColor: '#bac2de',
      height: 45,
    },
    parent: MainWin,
    modal: true,
    show: false,
    icon: path.join(__dirname, '/images/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '/scripts/preload.js')
    }
  })

  SetWin.loadFile('settings.html')
  SetWin.on('ready-to-show', () => { SetWin.show(); getMetadata(videoURL, type) })
}

const createUrl = () => {
  UrlWin = new BrowserWindow({
    width: 450,
    height: 150,
    resizable: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#181825',
      symbolColor: '#bac2de',
      height: 45,
    },
    parent: SetWin,
    modal: true,
    show: false,
    icon: path.join(__dirname, '/images/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '/scripts/preload.js')
    }
  })

  UrlWin.loadFile('url.html')
  UrlWin.on('ready-to-show', () => { UrlWin.show() })
}

const chooseDirectory = () => {
  dialog.showOpenDialog(MainWin, {
    title: 'Select download folder',
    buttonLabel: 'Select',
    properties: ['openDirectory']
  }).then((e) => { if (!e.canceled) { MainWin.webContents.send('sendDirectory', e.filePaths[0]) } })
}

/* Async functions */
const getMetadata = async (videoURL) => {
  if (videoURL !== currentVideo) {
    rawMetadata = await YtDlpWrap.getVideoInfo(videoURL)

    if (rawMetadata.artist) {
      metadata.track = rawMetadata.track
      metadata.artist = rawMetadata.artist
      metadata.album = rawMetadata.album
      metadata.upload_year = rawMetadata.upload_date.replace(/(?<=^\d{4}).*/gm, '')
    }
    else {
      metadata.track = rawMetadata.title
      metadata.artist = rawMetadata.uploader
      metadata.album = ''
      metadata.upload_year = rawMetadata.upload_date.replace(/(?<=^\d{4}).*/gm, '')
    }

    metadata.art = rawMetadata['thumbnails'].pop()['url']
    currentVideo = videoURL
  }
  else if (!changedMetadata.no) {
    SetWin.webContents.send('sendMetadata', changedMetadata)
    return
  }

  SetWin.webContents.send('sendMetadata', metadata)
}

const getYTDlp = async () => {
  if (!fs.existsSync(getAppDataPath("ytm-dlp"))) {
    fs.mkdir(getAppDataPath("ytm-dlp"), (err) => { if (err) { console.error(err) } })
  }

  if (!fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"))) {
    fs.mkdir(path.join(getAppDataPath("ytm-dlp"), "yt-dlp"), (err) => { if (err) { console.error(err) } })
    await YTDlpWrap.downloadFromGithub(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"))
  }

  if (!fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/arguments.txt"))) {
    fs.writeFile(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/arguments.txt"), `-o
"./ytm-dlp/%(artist)s - %(title)s.%(ext)s"
-x
-f
bestaudio
--embed-thumbnail
--embed-metadata
--parse-metadata
":(?P<meta_synopsis>)"
--parse-metadata
":(?P<meta_purl>)"
--parse-metadata
":(?P<meta_comment>)"
--parse-metadata
":(?P<meta_description>)"
--sponsorblock-remove
all
--ffmpeg-location
${path.join(getAppDataPath("ytm-dlp"), "ffmpeg")}
--ppa
"ThumbnailsConvertor+ffmpeg_o:-c:v png -vf crop='ih'"
--parse-metadata
"upload_date:(?P<meta_date>^[0-9]{4})"
--replace-in-metadata
"artist"
"(,[a-zа-яА-ЯA-Z0-9_ ]).*"
""`,
      (err) => { if (err) { console.error(err) } })
  }

  if (!fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffmpeg.exe")) || !fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffprobe.exe"))) {
    ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], { destination: path.join(getAppDataPath("ytm-dlp"), "/ffmpeg/") }, (err) => { if (err) { console.error(err) } })
  }
}