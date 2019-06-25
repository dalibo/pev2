const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
  publicPath: '',
  configureWebpack: {
    plugins: [
      // To strip all locales except “en”
      new MomentLocalesPlugin()
    ]
  }
}
