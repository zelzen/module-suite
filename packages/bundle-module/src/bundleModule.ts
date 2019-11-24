import { normalize } from 'path';
import { rollup, Plugin } from 'rollup';
import { terser as pluginTerser } from 'rollup-plugin-terser';
import parsePackageUrl from 'shared/utils/packageJson/parsePackageUrl';
import isLocalIdentifier from 'shared/utils/isLocalIdentifier';
import proxierImportPlugin from './proxierImportPlugin';
import { Context } from './models';
import { name as appName, version as appVersion } from '../package.json';

const banner = `/**
 * Bundled with ${appName} v${appVersion}
 * @preserve
 */`;

// TODO: Support bundles with dynamic imports. Leave them as is.
export default async function bundleModule(
  code: string,
  {
    packageName,
    packageVersion,
    dependencies,
    host,
    shouldMinify = false,
    format = 'esm',
    rootFilePath,
  }: Context
) {
  console.log('[bundle-module] Bundling', packageName);

  // Resolves imported "file"
  // since we are loaded from memory.
  const importResolver: Plugin = {
    name: 'importResolver',
    resolveId(id) {
      if (id === rootFilePath) return id;
    },
    load(id) {
      if (id === rootFilePath) return code;
      return null;
    },
  };

  const plugins: Array<Plugin> = [
    importResolver,
    proxierImportPlugin(packageName, packageVersion, host, dependencies),
  ];

  // Minify full chunk with terser
  if (shouldMinify) plugins.push(pluginTerser());

  try {
    const bundle = await rollup({
      input: rootFilePath,
      plugins,
      external(id) {
        // console.log('external', id);
        // Self referenced imports over the CDN
        // should also be included.
        if (id.startsWith('http') && id.includes(packageName)) {
          return false;
        }
        // Locally referenced imports should be bundled.
        if (isLocalIdentifier(id)) return false;

        // Everything else is external
        // and shouldn't be bundled.
        return true;
      },
    });

    // TODO: Limit output chunks to 1
    const { output } = await bundle.generate({
      format,
      banner,
      // Rewrite external imports
      // to be fully qualified urls.
      // e.g. "object-assign" => "https://module-cdn.exmaple.com/object-assign@^4.1.1?output=system"
      paths(id): string {
        // Skip id which are already urls
        if (id.startsWith('http')) return id;

        // TODO: This doesn't rewrite dynamic imports
        // https://github.com/rollup/rollup/issues/2579
        const importedId = parsePackageUrl(id);
        // console.log('paths', id, importedId);
        if (importedId === null) return id;
        const version = dependencies[importedId.packageName] || '*';
        if (version === '*') {
          console.warn(
            `[bundle-module] Unable to resolve package version for external dependency "${importedId.packageName}". Make sure to pass all dependencies.`
          );
        }

        return (
          host +
          normalize(`/${importedId.packageName}@${version}${importedId.fileName}?output=${format}`)
        );
      },
    });

    return output[0].code;
  } catch (err) {
    console.log('[bundle-module] An error occurred while bundling.');
    console.error(err);
    // Re-throw error so consume can catch
    throw err;
  }
}
