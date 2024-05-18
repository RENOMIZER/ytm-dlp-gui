# ytm-dlp-gui 
<!-- ![logo](https://raw.githubusercontent.com/RENOMIZER/ytm-dlp-gui/main/src/images/icon.ico) -->

> An ElectronJS app for downloading music off Youtube Music

[![License](https://img.shields.io/badge/License-MIT-green)](https://github.com/RENOMIZER/ytm-dlp-gui/blob/main/LICENSE)

This app allows you to download audio off YouTube and YouTube Music in best quality available, 
change its metadata (such as title, artist's name, and genre) and save it in MP3, OPUS, M4A or FLAC format.

## How to use it?

### Step 1
Paste a URL of a YouTube song, music video or a playlist in the field right under "Waiting" lable.

### Step 2
Select the download directory by clicking on the folder icon in the bottom of the window
or paste the directory path manualy in the field right next to the button.
> [!NOTE]
> If left empty, the file will be downloaded in the program installation directory.

### Step 3
Select the preferable audio format:
- MP3 - lightweight but lossy;
- OPUS - weights more but quality loss is lower;
- M4A - weights even more but quality is also better;
- FLAC - lossless format, best quality.

### Step 3.5 (For downloading playlists)
Select the order of songs:
- None - songs won't be ordered;
- Strict - songs will be ordered according to their positions in playlist.

### Step 4
Press "download" button on the left of the URL input field.

### Step 4.5 (For changing metadata)
> [!NOTE]
> Changing metadata unavailable if you are downloading a playlist.

Press "edit" button on the right of the URL input field.

Edit the metadata to your like.

> [!IMPORTANT]
> Be aware that "Lyrics" setting will have effect only if selected output format is not MP3.

After you've finished press on the green "accept" button.

Press "download" button on the left of the URL input field.

<!-- 
## How to build it?
_Make sure you have NodeJS and [WiX v3 build tools](https://github.com/wixtoolset/wix3/releases/latest) installed if you are building for Windows_

1. Clone the repo
2. Open cloned repo in terminal and run `npm install`
3. Run `npm run make` to build distributables or `npm run package` to build unzipped package

The output files will be available in 'out' directory
-->
