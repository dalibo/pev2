const MomentLocalesPlugin = require("moment-locales-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");

module.exports = {
  publicPath: "",
  productionSourceMap: process.env.NODE_ENV != "production",
  pages: {
    index: {
      entry: "example/src/main.ts",
      template: "example/index.html",
      filename: "pev2.html",
    },
  },
  css: {
    extract: !!process.env.EXTRACT_CSS,
  },
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .loader("vue-loader")
      .tap((options) => ({
        ...options,
        compilerOptions: {
          ...options.compilerOptions,
          whitespace: "preserve",
        },
      }));
  },
  configureWebpack: {
    plugins: [
      // To strip all locales except “en”
      new MomentLocalesPlugin(),
      new HtmlWebpackPlugin(),
      new HtmlInlineScriptPlugin(),
    ],
    optimization: {
      splitChunks: false,
    },
  },
  runtimeCompiler: true,
};
