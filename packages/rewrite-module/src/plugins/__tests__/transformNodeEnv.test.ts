import { transform } from '@babel/core';
import { Context } from '../../models';
import transformNodeEnv from '../transformNodeEnv';

const defaultContext: Context = {
  /** Host Address */
  host: 'http://localhost:3030',
  /** Name of current package */
  packageName: 'test',
  /** Version of current package */
  packageVersion: '1.0.0',
  /** Current Referenced File Name */
  currentFile: 'lib/index.js',
  /** Dependency keys and version values */
  dependencies: {},
  /** If we should minify the output */
  shouldMinify: true,
  /** Requested output module type */
  output: 'esm',
  /** Requested transforms to perform */
  transforms: new Set(['nodeenv']),
};

const createTransform = (code: string, context?: Partial<Context>) => {
  // @ts-ignore
  return transform(code, {
    plugins: [
      transformNodeEnv({
        ...defaultContext,
        ...context,
      }),
    ],
    sourceType: 'unambiguous',
    babelrc: false,
    configFile: false,
  }).code;
};

it('should transform process.env.NODE_ENV to "production"', () => {
  const code = `
  const env = process.env.NODE_ENV;
  const env2 = process.env['NODE_ENV'];
  `;

  expect(
    createTransform(code, {
      shouldMinify: true,
    })
  ).toMatchInlineSnapshot(`
    "const env = \\"production\\";
    const env2 = \\"production\\";"
  `);
});

it('should transform process.env.NODE_ENV to "development"', () => {
  const code = `
  const env = process.env.NODE_ENV;
  const env2 = process.env['NODE_ENV'];
  `;

  expect(
    createTransform(code, {
      shouldMinify: false,
    })
  ).toMatchInlineSnapshot(`
    "const env = \\"development\\";
    const env2 = \\"development\\";"
  `);
});

// Build dead code elimination into transform
// instead of using babel-plugin-minify-dead-code-elimination
it.skip('should remove dead NODE_ENV code blocks', () => {
  const code = `
    if (process.env.NODE_ENV === 'production') {
      console.log('Hello')
    } else {
      console.log('Goodbye')
    }

    const isDev = process.env.NODE_ENV === 'development' ? 'yes' : 'no'
  `;

  expect(createTransform(code)).toMatchInlineSnapshot(`
    "console.log('Hello');
    const isDev = 'no';"
  `);
});
