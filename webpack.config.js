const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/browser.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'docs/js'),
  },
};