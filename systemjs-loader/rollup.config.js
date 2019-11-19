const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const pkg = require('./package.json');
const createConfig = require('../createConfig');


const configs = createConfig({
  input: path.join(__dirname, 'src', 'index.ts'),
  pkgJson: pkg,
});
const baseConfig = configs.base;

// UMD Config
configs.push({
  ...baseConfig,
  output: {
    ...baseConfig.output,
    format: 'umd',
    file: `dist/loader.umd.js`,
  },
  // Include all externals
  external: [],
  plugins: [...baseConfig.plugins, resolve(), commonjs()],
});

// IIFE Config
configs.push({
  ...baseConfig,
  output: {
    ...baseConfig.output,
    format: 'iife',
    file: `dist/loader.js`,
    extend: true,
  },
  // Include all externals
  external: [],
  plugins: [...baseConfig.plugins, resolve(), commonjs()],
});

module.exports = configs;
