module.exports = {
  packagerConfig: {
    asar: true,
    icon: './images/icon'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: "RENOMIZER",
        copyright: "RENOMIZER",
        description: "An ElectronJS app for downloading music off Youtube Music",
        exe: "YTM-DLP-GUI.exe",
        name: "YTM-DLP",
        setupExe: "YTM-DLP-GUI Install.exe",
        setupIcon: './images/icon.ico',
        loadingGif: 'images/loading.gif',
      },
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        description: "An ElectronJS app for downloading music off Youtube Music",
        exe: "YTM-DLP-GUI",
        icon: './images/icon.ico',
        language: 1033,
        manufacturer: "RENOMIZER",
        name: "YTM-DLP",
        shortName: "ytmdlp",
        shortcutFolderName: "YTM-DLP",
        ui: {
          chooseDirectory: true,
        },
        UpgradeCode: "EF709413-C446-49FC-8940-BA64D74532CD",
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'RENOMIZER',
          name: 'ytm-dlp-gui'
        },
        prerelease: false,
        draft: true
      }
    }
  ]
};
