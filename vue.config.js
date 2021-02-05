const MomentLocalesPlugin = require("moment-locales-webpack-plugin");

module.exports = {
  publicPath: "",
  productionSourceMap: process.env.NODE_ENV != "production",
  pages: {
    index: {
      entry: "example/src/main.ts",
      template: "example/index.html",
    },
  },
  css: {
    extract: false,
  },
  configureWebpack: {
    plugins: [
      // To strip all locales except “en”
      new MomentLocalesPlugin(),
    ],
  },
};
