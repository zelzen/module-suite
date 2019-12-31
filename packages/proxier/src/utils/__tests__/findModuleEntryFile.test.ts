import findModuleEntryFile from '../findModuleEntryFile';

describe('resolve entries in order', () => {
  const pkgResolutionOrder = {
    unpkg: 'unpkg.js',
    browser: 'browser.js',
    module: '/lib',
    main: '/esm/main.js',
    undefined: 'index.js',
  };

  it.each(Object.entries(pkgResolutionOrder))(`%# resolves %s entry`, (entry, expected) => {
    expect(findModuleEntryFile(pkgResolutionOrder)).toBe(expected);
    // Remove entry
    // @ts-ignore
    delete pkgResolutionOrder[entry];
  });
});
