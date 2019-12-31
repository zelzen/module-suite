import { PackageJson } from 'shared/models/packageJson';

type Pkg = {
  unpkg?: PackageJson['unpkg'];
  browser?: PackageJson['browser'];
  module?: PackageJson['module'];
  main?: PackageJson['main'];
};

export default function findModuleEntryFile(pkg: Pkg): string {
  // Only support simple browser spec
  // https://github.com/defunctzombie/package-browser-field-spec#replace-specific-files---advanced
  const browserDec = typeof pkg.browser === 'string' && pkg.browser;
  return (
    // Use unpkg declaration first.
    // Unpkg is a npm proxy similar to ours,
    // so using this bundle is a good bet.
    pkg.unpkg ||
    // Browser field is before module / main because
    // if this is present, it implies a custom browser specific build.
    browserDec ||
    pkg.module ||
    pkg.main ||
    // File name defaults to index.js if none
    // is specified in the package.json
    // https://stackoverflow.com/a/22513200/6635914
    'index.js'
  );
}
