/* Modules */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fetch = require("electron-fetch").default;
const getAppDataPath = require("appdata-path");
const ffbinaries = require('ffbinaries-plus');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/* Classes */
const YtDlpWrap = new YTDlpWrap(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"));
Date.prototype.dateNow = function () {
  return ((this.getUTCDate() < 10)?"0":"") + this.getUTCDate() +"-"+ this.getUTCMonth()+1 +"-"+ this.getUTCFullYear();
}
Date.prototype.timeNow = function () {
  return ((this.getHours() < 10)?"0":"") + this.getHours() +"-"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +"-"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}
const date = new Date()

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
let language

/* Initialisation */
if (require('electron-squirrel-startup')) return;

let logStream = fs.createWriteStream(path.join(os.tmpdir(), `ytm-dlp-log-${date.timeNow()}-${date.dateNow()}.txt`))

app.whenReady().then(() => {
  ipcMain.on('startDownload', startDownload)
  ipcMain.on('clickedSettings', createSettings)
  ipcMain.on('recieveMetadata', (_event, metadata) => { changedMetadata = metadata })

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

  ipcMain.on('recieveLanguage', (_event, lang) => {
    if (lang !== language.current) {
      fs.writeFileSync(path.join(getAppDataPath("ytm-dlp"), "config.json"), `{\n\t"lang": "${lang}"\n}`)
      app.relaunch()
      app.quit()
    }
  })

  ipcMain.on('chooseDirectory', () => {
    dialog.showOpenDialog(MainWin, {
      title: 'Select download folder',
      buttonLabel: 'Select',
      properties: ['openDirectory']
    }).then((e) => { if (!e.canceled) { MainWin.webContents.send('sendDirectory', e.filePaths[0]) } })
  })

  ipcMain.on('reloadMetadata', () => { SetWin.webContents.send('sendMetadata', metadata); customArt = null })
  ipcMain.handle('getLanguage', () => { return language })
  ipcMain.on('openAbout', createAbout)

  ipcMain.on('openArt', () => {
    dialog.showOpenDialog(SetWin, {
      title: 'Select album artwork',
      buttonLabel: 'Select',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
      ],
      properties: ['openFile']
    }).then((e) => { if (!e.canceled) { SetWin.webContents.send('sendArt', e.filePaths[0]); customArt = e.filePaths[0] } })
  })

  ipcMain.on('getArt', createUrl)

  getExecs()
  getLang()
  createMain()

  app.on('window-all-closed', () => {
    logStream.end(`[info] Log end.`)
    app.quit()
  })
})

/* General functions */
const startDownload = (_event, videoURL, dirPath, ext, order) => {
  let arguments = fs.readFileSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/arguments.list"), 'UTF-8').split(/\n/).map(e => { return e.replace(/"/g, '') })

  if (!changedMetadata.no) {
    for (let i = 0; i < 10; i++) {
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
      '--parse-metadata', "NA:%(meta_title)s",
      '--parse-metadata', "NA:%(title)s",
      '--parse-metadata', "NA:%(meta_artist)s",
      '--parse-metadata', "NA:%(artist)s",
      '--parse-metadata', "NA:%(album_artist)s",
      '--parse-metadata', "NA:%(meta_album)s",
      '--parse-metadata', "NA:%(meta_date)s",
      '--parse-metadata', "NA:%(genre)s",

      '--replace-in-metadata', 'meta_title', 'NA', changedMetadata.track,
      '--replace-in-metadata', 'title', 'NA', changedMetadata.track,
      '--replace-in-metadata', 'meta_artist', 'NA', changedMetadata.artist,
      '--replace-in-metadata', 'artist', 'NA', changedMetadata.artist,
      '--replace-in-metadata', 'album_artist', 'NA', changedMetadata.album_artist,
      '--replace-in-metadata', 'meta_album', 'NA', changedMetadata.album,
      '--replace-in-metadata', 'meta_date', 'NA', changedMetadata.upload_year,
      '--replace-in-metadata', 'genre', 'NA', changedMetadata.genre,
    )
  }

  if (path && fs.existsSync(dirPath)) {
    for (let i = 0; i < 2; i++) {
      arguments.shift()
    }

    arguments.unshift(
      '-o', `${dirPath}/%(artist,uploader)s - %(title,meta_title)s.%(ext)s`
    )
  }

  if (order == 'strict') {
    arguments.push(
      '--parse-metadata', "playlist_index:%(track_number)s",
    )
  }

  arguments.push(
    '--audio-format', ext,
    '--audio-quality', '0',
    videoURL
  )

  YtDlpWrap.exec(arguments)
    .on('ytDlpEvent', (eType, eData) => {
      console.log('[' + eType + ']', eData)
      logStream.write(`[${eType}] ${eData}\n`)

      if (eType == 'download' && eData.slice(1, 4) != 'Des' && eData.slice(4, 5) == '.') {
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
  changedMetadata = { "no": "data" }
}

const createMain = () => {
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

const createSettings = (_event, videoURL, type) => {
  SetWin = new BrowserWindow({
    width: 600,
    height: 800,
    resizable: false,
    title: language.edit,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#181825',
      symbolColor: '#bac2de',
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
  SetWin.on('ready-to-show', () => { SetWin.show(); getMetadata(videoURL, type) })
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
      color: '#181825',
      symbolColor: '#bac2de',
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
      color: '#181825',
      symbolColor: '#bac2de',
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

const getLang = () => {
  if (!fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "config.json"))) {
    fs.writeFileSync(path.join(getAppDataPath("ytm-dlp"), "config.json"), `{\n\t"lang": "en"\n}`)
  }

  let local = JSON.parse(fs.readFileSync(path.join(getAppDataPath("ytm-dlp"), "config.json")))
  language = JSON.parse(fs.readFileSync(path.join(__dirname, '/lang/', local.lang + '.json')))
}

/* Async functions */
const getMetadata = async (videoURL) => {
  if (videoURL !== currentVideo) {
    rawMetadata = await YtDlpWrap.getVideoInfo(videoURL)

    if (rawMetadata.artist) {
      metadata.track = rawMetadata.track
      metadata.artist = rawMetadata.artist
      metadata.album = rawMetadata.album
      metadata.upload_year = rawMetadata.description.match(/(?<=Released on: )[0-9]{4}/gm)
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
  }
  else if (!changedMetadata.no) {
    SetWin.webContents.send('sendMetadata', changedMetadata)
    return
  }

  SetWin.webContents.send('sendMetadata', metadata)
}

const getExecs = async () => {
  if (!fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp"))) {
    fs.mkdir(path.join(getAppDataPath("ytm-dlp"), "yt-dlp"), { recursive: true }, (err) => { if (err) { throwErr(err) } })
  }

  if (!fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"))) {
    await YTDlpWrap.downloadFromGithub(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"))
  } else {
    exec(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('Usage:')) {
        throwErr('YT-DLP executable error')

        fs.unlinkSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"))
        await YTDlpWrap.downloadFromGithub(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/yt-dlp.exe"))
      }
    })
  }

  if (!fs.existsSync(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/arguments.list"))) {
    fs.writeFile(path.join(getAppDataPath("ytm-dlp"), "yt-dlp/arguments.list"), `-o
			"./ytm-dlp/%(artist,uploader)s - %(title)s.%(ext)s"
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
			--parse-metadata
			"description:(?P<meta_date>(?<=Released on: )[0-9]{4}")
			--parse-metadata
			"%(album_artist,artist,uploader)s:%(album_artist)s"
			--replace-in-metadata
			"artist"
			"(,[a-zа-яА-ЯA-Z0-9_ ]).*"
			""`.replace(/\t/gm, ''),
      (err) => { if (err) { throwErr(err) } })
  }

  ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], { destination: path.join(getAppDataPath("ytm-dlp"), "/ffmpeg/") }, (err) => {
    if (err) { throwErr(err) }

    exec(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffmpeg"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffmpeg version')) {
        throwErr('FFMpeg executable error')

        if (os.platform() === 'win32') {
          fs.unlinkSync(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffmpeg.exe"))
        }
        else {
          fs.unlinkSync(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffmpeg"))
        }
        ffbinaries.downloadBinaries(['ffmpeg'], { destination: path.join(getAppDataPath("ytm-dlp"), "/ffmpeg/") }, (err) => { if (err) { throwErr(err) } })
      }
    })

    exec(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffprobe"), async (_error, _stdout, stderr) => {
      if (!stderr.includes('ffprobe version')) {
        throwErr('FFProbe executable error')

        if (os.platform() === 'win32') {
          fs.unlinkSync(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffprobe.exe"))
        }
        else {
          fs.unlinkSync(path.join(getAppDataPath("ytm-dlp"), "ffmpeg/ffprobe"))
        }
        ffbinaries.downloadBinaries(['ffprobe'], { destination: path.join(getAppDataPath("ytm-dlp"), "/ffmpeg/") }, (err) => { if (err) { throwErr(err) } })
      }
    })
  })
}

const throwErr = (err) => {
  console.error(err)
  logStream.write(`[error] ` + err + '\n\n')
}