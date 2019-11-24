import { transform } from '@babel/core';
import { Context } from '../../models';
import transformImports from '../transformImports';

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
  shouldMinify: false,
  /** Requested output module type */
  output: 'esm',
  /** Requested transforms to perform */
  transforms: new Set(['imports']),
};

const createTransform = (code: string, context?: Partial<Context>) => {
  // @ts-ignore
  return transform(code, {
    plugins: [
      transformImports({
        ...defaultContext,
        ...context,
      }),
    ],
    sourceType: 'unambiguous',
    babelrc: false,
    configFile: false,
  }).code;
};

it('transforms import keyword', () => {
  const code = `
  import React from 'react';
  import emotion from 'emotion';
  
  function MyFunc() {
    console.log(React, emotion)
    return 'nice'
  }

  export default MyFunc;
  `;
  const res = createTransform(code);

  // @ts-ignore
  expect(res).toMatchInlineSnapshot(`
    "import React from \\"http://localhost:3030/react@*?output=esm\\";
    import emotion from \\"http://localhost:3030/emotion@*?output=esm\\";

    function MyFunc() {
      console.log(React, emotion);
      return 'nice';
    }

    export default MyFunc;"
  `);
});

it('should transform require calls', () => {
  const code = `
  const React = require('react');
  const emotion = require('emotion');
  `;

  expect(createTransform(code)).toMatchInlineSnapshot(`
    "const React = require(\\"http://localhost:3030/react@*?output=esm\\");

    const emotion = require(\\"http://localhost:3030/emotion@*?output=esm\\");"
  `);
});

it('should not transform window.require calls', () => {
  const code = `const React = window.require('react');`;

  expect(createTransform(code)).toEqual(code);
});

it('should not rewrite specifiers that start with http', () => {
  const code = `
  import React from "http://localhost:3030/react@latest";
  import emotion from "http://localhost:3030/emotion@*"
  `;

  expect(createTransform(code)).toMatchInlineSnapshot(`
    "import React from \\"http://localhost:3030/react@latest\\";
    import emotion from \\"http://localhost:3030/emotion@*\\";"
  `);
});

it('should use dependency versions specified', () => {
  const code = `
  import React from 'react';
  import emotion from 'emotion';
  `;

  const res = createTransform(code, {
    dependencies: {
      react: '16.8.6',
      emotion: '>=3',
    },
  });

  expect(res).toMatchInlineSnapshot(`
    "import React from \\"http://localhost:3030/react@16.8.6?output=esm\\";
    import emotion from \\"http://localhost:3030/emotion@>=3?output=esm\\";"
  `);
});

it('should rewrite re-exports', () => {
  const code = `
  export * from 'emotion';
  export { Component } from 'react';
  `;

  expect(createTransform(code)).toMatchInlineSnapshot(`
    "export * from \\"http://localhost:3030/emotion@*?output=esm\\";
    export { Component } from \\"http://localhost:3030/react@*?output=esm\\";"
  `);
});

it('should rewrite local import references', () => {
  const code = `
    import namespace from './utils/namespace.js';
    import * as models from './models';
    import isDir from '/isDir';
    import createTemplate from '../template/createTemplate'
  `;

  expect(createTransform(code)).toMatchInlineSnapshot(`
    "import namespace from \\"http://localhost:3030/test@1.0.0/lib/utils/namespace.js?output=esm\\";
    import * as models from \\"http://localhost:3030/test@1.0.0/lib/models?output=esm\\";
    import isDir from \\"http://localhost:3030/test@1.0.0/lib/isDir?output=esm\\";
    import createTemplate from \\"http://localhost:3030/test@1.0.0/template/createTemplate?output=esm\\";"
  `);
});
