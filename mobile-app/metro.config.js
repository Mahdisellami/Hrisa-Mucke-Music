const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Map TS paths for Metro
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_, name) => path.join(__dirname, name),
  }
);

module.exports = config;
