// const typescript = require('rollup-typescript');
const replace = require('rollup-plugin-replace');
const babel = require('rollup-plugin-babel');
const extension = require('rollup-plugin-extensions');
const json = require('rollup-plugin-json');
const nodeStandardLibrary = require('builtins');

const { NODE_ENV = 'production' } = process.env;

function createConfig({
  input,
  pkgJson,
  isDev = NODE_ENV !== 'production',
  plugins = [],
  externals = [],
  extensions = ['.tsx', '.ts', '.jsx', '.js'],
  sourcemap = false,
}) {
  // Gather external modules
  const pkgExternals = new Set(
    Object.keys(pkgJson).reduce(
      (accumulator, key) => {
        if (key.match(/dependencies/i)) {
          const value = pkgJson[key];
          return accumulator.concat(Object.keys(value));
        }

        return accumulator;
      },
      // Add in user defined externals
      externals.concat(nodeStandardLibrary())
    )
  );

  const banner = `/**
 * ${pkgJson.name} v${pkgJson.version}
 * Author: ${pkgJson.author}
 *
 * ${pkgJson.homepage || pkgJson.repository.url}
 */
`;

  const baseConfig = {
    input,
    output: {
      name: pkgJson.name,
      sourcemap,
      banner,
    },
    external: (id) => {
      // All internal shared packages are internal
      if (id.startsWith('shared')) return false;
      // Check the current packages
      if (pkgExternals.has(id)) return true;
      return false;
    },
    onwarn(warning, warn) {
      // Throw an error on unresolved dependencies (not listed in package json)
      if (warning.code === 'UNRESOLVED_IMPORT')
        throw new Error(`${warning.message}.
Make sure this dependency is listed in the package.json
      `);

      // Use default for everything else
      warn(warning);
    },
    plugins: [
      json(),
      extension({
        extensions,
      }),
      // rollup-plugin-typescript can't resolve "baseUrl" from tsconfig. Using Babel instead.
      // typescript(),
      babel({
        rootMode: 'upward-optional',
        exclude: 'node_modules/**',
        // Support Typescript extensions
        extensions,
      }),
      replace({
        __DEV__: isDev,
      }),
      ...plugins,
    ].filter(Boolean),
  };

  const configs = [];

  // Commonjs Config
  const cjsConfig = {
    ...baseConfig,
    output: {
      ...baseConfig.output,
      format: 'cjs',
      file: pkgJson.main,
    },
  };
  configs.push(cjsConfig);

  // ES Modules config
  // Check if there is a field for module
  if (typeof pkgJson.module === 'string') {
    const esmConfig = {
      ...baseConfig,
      output: {
        ...baseConfig.output,
        format: 'es',
        file: pkgJson.module,
      },
    };
    configs.push(esmConfig);
  }

  // Expose the base config
  configs.base = baseConfig;
  // Return all configs
  return configs;
}

module.exports = createConfig;
