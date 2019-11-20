import createImport from '../createImport';

const host = 'http://localhost:3030';

it('should create an import', () => {
  const res = createImport('react', '16.11.0', { host });

  expect(res).toBe(`${host}/react@16.11.0`);
});

it('should handle proxy options', () => {
  const res = createImport('react', '16.11.0', {
    minify: true,
    output: 'system',
    transforms: ['nodeenv', 'imports'],
    host,
  });

  expect(res).toBe(`${host}/react@16.11.0?minify=true&output=system&transforms=nodeenv%2Cimports`);
});

it('should handle filePaths', () => {
  const res = createImport('react', '16.11.0', {
    filePath: '/cjs/react.production.min.js',
    host,
  });

  expect(res).toBe(`${host}/react@16.11.0/cjs/react.production.min.js`);
});

it('should allow semver ranges', () => {
  const res = createImport('react', '^16.11.0', {
    filePath: '/cjs/react.production.min.js',
    host,
  });

  expect(res).toBe(`${host}/react@^16.11.0/cjs/react.production.min.js`);
});

it('should error on invalid semver', () => {
  const res = () =>
    createImport('react', '16.11.', {
      filePath: '/cjs/react.production.min.js',
      host,
    });

  expect(res).toThrow();
});

it('should pass "false" if no transforms are specified', () => {
  const res = createImport('react', '16.11.0', {
    transforms: [],
    host,
  });

  expect(res).toBe(`${host}/react@16.11.0?transforms=false`);
});

it('should ignore blank query options', () => {
  const res = createImport('react', '16.11.0', {
    transforms: undefined,
    filePath: undefined,
    output: undefined,
    host,
  });

  expect(res).toBe(`${host}/react@16.11.0`);
});
