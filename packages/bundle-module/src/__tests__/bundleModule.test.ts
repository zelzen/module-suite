import bundleModule from '../bundleModule';

jest.mock('../../package.json', () => ({
  name: '@module-suite/bundle',
  // Mock version so snapshot don't change every release
  version: '1.0.0',
}));

describe('should bundle react@16.8.6', () => {
  // From: https://d3pfvg4wng2sfk.cloudfront.net/react@16.8.6?output=source&transforms=false&minify=false
  const code = `
'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react.production.min.js');
} else {
  module.exports = require('./cjs/react.development.js');
}
`;
  const defaultOpts = {
    host: 'https://d3pfvg4wng2sfk.cloudfront.net',
    packageName: 'react',
    packageVersion: '16.8.6',
    rootFilePath: 'index.js',
    format: 'esm',
    dependencies: {
      'loose-envify': '^1.1.0',
      'object-assign': '^4.1.1',
      'prop-types': '^15.6.2',
      scheduler: '^0.13.6',
    },
  };

  it('should match ESM snapshot', async () => {
    const bundle = await bundleModule(code, {
      ...defaultOpts,
      shouldMinify: false,
      format: 'esm',
    });

    expect(bundle).toMatchSnapshot();
  });

  it('should bundle ESM and minify', async () => {
    const bundle = await bundleModule(code, {
      ...defaultOpts,
      shouldMinify: true,
      format: 'esm',
    });

    expect(bundle).toBeDefined();
  });

  it('should match SystemJS snapshot', async () => {
    const bundle = await bundleModule(code, {
      ...defaultOpts,
      shouldMinify: false,
      format: 'system',
    });

    expect(bundle).toMatchSnapshot();
  });
});
