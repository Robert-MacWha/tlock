const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for Node.js polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  url: require.resolve('url/'),
  buffer: require.resolve('buffer'),
  stream: require.resolve('readable-stream'),
};

// Add the polyfill modules to resolver platforms
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

module.exports = config;
