module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'src/images/icon',
		executableName: "ytm-dlp-gui",
		name: "YTM-DLP-GUI",
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: "RENOMIZER",
        copyright: "RENOMIZER",
        description: "An ElectronJS app for downloading music off Youtube Music",
        exe: "YTM-DLP.exe",
        name: "YTM-DLP",
        setupExe: "YTM-DLP-GUI.exe",
        setupIcon: 'src/images/icon.ico',
        loadingGif: 'src/images/loading.gif',
        title: 'YTM-DLP',
      },
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        description: "An ElectronJS app for downloading music off Youtube Music",
        exe: "YTM-DLP",
        icon: 'src/images/icon.ico',
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
      config: {
				options: {
					categories: ["Audio"],
					depends: ["libgtk-3-0", "libnotify4", "libnss3", "libatspi2.0-0"],
					description: "An app for downloading music off YouTube Music",
					homepage: "https://github.com/RENOMIZER/ytm-dlp-gui",
					icon: "src/images/icon.ico",
					maintainer: "RENOMIZER",
					name: "ytm-dlp",
					priority: "optional",
					productName: "YTM-DLP",
					section: ["misc"],
					size: "70MB",
					version: "1.0.4"
				},
			},
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
