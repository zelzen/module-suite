import createDepUrls from '../createDependencyUrls';

const host = 'http://localhost:3030';

const deps = {
  react: '^16.11.0',
  emotion: '4.0.0',
  '@module-suite/systemjs-loader': '>2',
  foo: '4.x.x',
};

it('should create imports', () => {
  const res = createDepUrls(deps, { host });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "@module-suite/systemjs-loader": "http://localhost:3030/@module-suite/systemjs-loader@>2",
      "emotion": "http://localhost:3030/emotion@4.0.0",
      "foo": "http://localhost:3030/foo@4.x.x",
      "react": "http://localhost:3030/react@^16.11.0",
    }
  `);
});

it('should create imports from pathNames', () => {
  const res = createDepUrls(deps, {
    host,
    filePaths: {
      react: '/cjs/react.production.min.js',
      emotion: '/dist/emotion.umd.min.js',
    },
  });

  expect(res).toMatchInlineSnapshot(`
    Object {
      "@module-suite/systemjs-loader": "http://localhost:3030/@module-suite/systemjs-loader@>2",
      "emotion": "http://localhost:3030/emotion@4.0.0/dist/emotion.umd.min.js",
      "foo": "http://localhost:3030/foo@4.x.x",
      "react": "http://localhost:3030/react@^16.11.0/cjs/react.production.min.js",
    }
  `);
});

it('should should pass import options', () => {
  const res = createDepUrls(deps, {
    host,
    transforms: ['imports', 'nodeenv'],
    minify: true,
    filePaths: {
      react: '/cjs/react.production.min.js',
    },
  });

  expect(res).toMatchInlineSnapshot(`
    Object {
      "@module-suite/systemjs-loader": "http://localhost:3030/@module-suite/systemjs-loader@>2?minify=true&transforms=imports%2Cnodeenv",
      "emotion": "http://localhost:3030/emotion@4.0.0?minify=true&transforms=imports%2Cnodeenv",
      "foo": "http://localhost:3030/foo@4.x.x?minify=true&transforms=imports%2Cnodeenv",
      "react": "http://localhost:3030/react@^16.11.0/cjs/react.production.min.js?minify=true&transforms=imports%2Cnodeenv",
    }
  `);
});
