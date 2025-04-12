const {platform, homedir} = require('os');
const {join} = require('path');

const getLocalPath = (app) => {
  switch (platform()) {
    case 'win32':
      return join(homedir(), 'AppData', 'Local', app)
    case 'linux':
      return join(homedir(), '.local', 'share', app)
  }
}

module.exports = {
  getLocalPath: getLocalPath,
  default: getLocalPath
}