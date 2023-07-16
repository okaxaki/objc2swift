const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: "./src/browser.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "docs/js"),
  },
  resolve: {
    fallback: {
      util: require.resolve("util/"),
      process: require.resolve("process"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};
