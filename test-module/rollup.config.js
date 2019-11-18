const path = require('path');
const hashbang = require('rollup-plugin-hashbang');
const pkg = require('./package.json');
const createConfig = require('../createConfig');

module.exports = createConfig({
  input: path.join(__dirname, 'testModule.ts'),
  pkgJson: pkg,
  sourcemap: false,
  plugins: [hashbang()],
});
