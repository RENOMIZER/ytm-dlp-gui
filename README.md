# YTM-DLP 
![logo](https://raw.githubusercontent.com/RENOMIZER/ytm-dlp-gui/main/src/images/icon.ico)

An ElectronJS app for downloading music off Youtube Music

## What is it?
This is an app I created to make downloading music off YouTube easier.
It downloads audio only in best quality available, automaticaly appends
all important metadata (such as title of the song and artist's name)
and gives the ability to change them to what ever you'd like.

## Why is it a thing?
Main reason: I wanted a convinient tool for donloading music off YouTube since most online services dows not include the functionality I desired.

Secondary reason: For practice. I never developed any desktop apps before so I thought that this project would be a good opportunity to gain some experience in that field.

## How to use it?

### Step 1
Paste a URL of a YouTube song or a music video

![paste-url](https://github.com/RENOMIZER/ytm-dlp-gui/assets/94466218/f1679011-e2a8-4c87-be92-ddab3abc537e)

### Step 2
Click the gear icon and edit metadata to your like

![edit-metadata](https://github.com/RENOMIZER/ytm-dlp-gui/assets/94466218/3731ddba-2a1a-4cdd-9ae8-96bf218fba5c)

You can also change album cover art by loading an image from the URL or the local file

![edit-art](https://github.com/RENOMIZER/ytm-dlp-gui/assets/94466218/4d49ae57-70d3-4f14-bd12-5fd80aa471e5)

### Step 3
Enter the destination folder path _(if left empty the file will be downloaded to program installation directory)_ 
and click the download button

![click-download](https://github.com/RENOMIZER/ytm-dlp-gui/assets/94466218/4b130830-fb33-4c70-9a9d-62ed8b11ce13)

After that you will get your desired song with all metadata inplace

## How to build it?
_Make sure you have NodeJS and [WiX v3](https://wixtoolset.org/docs/wix3/) installed_

1. Clone the repo
2. Open cloned repo in terminal and run `npm install`
3. Run `npm run make` to build distributables or `npm run package` to build unzipped package

The output files will be available in 'out' directory
