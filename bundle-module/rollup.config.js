const path = require('path');
const pkg = require('./package.json');
const createConfig = require('../createConfig');

module.exports = createConfig({
  input: path.join(__dirname, 'src', 'index.ts'),
  pkgJson: pkg,
});
