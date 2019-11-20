import { normalize, dirname } from 'path';
import { Plugin } from 'rollup';
import got from 'got';
import rewriteModule from '@module-suite/rewrite';
import parsePackageUrl from 'shared/utils/packageJson/parsePackageUrl';
import isLocalIdentifier from 'shared/utils/isLocalIdentifier';
import { Context } from './models';

export default function proxierImportPlugin(
  packageName: string,
  packageVersion: string,
  host: string,
  dependencies: Context['dependencies']
): Plugin {
  return {
    name: 'proxierImportPlugin',
    /* Resolve URL to download Source Code */
    resolveId(id, importer) {
      // console.log('id', id, importer);
      // If import id is a fully
      // qualified url, pass it along.
      if (id.startsWith('http')) {
        // If it's a self reference make
        // sure the non transpiled version is loaded in.
        if (id.includes(packageName)) return `${id}&transforms=false&minify=false`;
        return id;
      }

      // Local imports
      if (isLocalIdentifier(id)) {
        // console.log('resolve', id, importer);
        let importDir = '';

        // Resolve root import dir for
        // modules loaded from the proxier.
        // This could include re-exports, and nested local imports.
        if (importer != null) {
          // Path import Dir from package if fully qualified url
          if (importer.startsWith(host)) {
            const importerModule = parsePackageUrl(importer);
            if (importerModule !== null) {
              // Reference the same starting dir if a local path
              importDir = dirname(importerModule.fileName);
            }
          }
          // Else use referenced dir name
          else {
            importDir = dirname(importer);
          }
        }
        // If import dir is referencing the same
        // directory, set it to an empty string.
        importDir = importDir === '.' || importDir === '/' ? '' : `/${importDir}`;
        // console.log('id', id, importDir);

        return (
          host +
          normalize(
            `/${packageName}@${packageVersion}${importDir}/${id}?output=esm&transforms=nodeenv,deadcode&minify=false`
          )
        );
      }

      // External Imports
      return id;
    },
    /* Load Source Code */
    async load(id) {
      // Don't bundle imports for other packages
      if (id.includes(packageName) === false) return null;

      // Download imported module source
      const { body } = await got(id);
      return body;
    },
    /* Transform Loaded Source Code */
    transform(chunkCode, fileName) {
      // No need to transform if it's
      // already ran through rewrite-module on the server.
      if (fileName.startsWith('http')) return chunkCode;

      return rewriteModule(chunkCode, {
        host,
        packageName,
        packageVersion,
        currentFile: fileName,
        dependencies,
        // Minification will be ran on the full
        // bundle chunk from rollup.
        // No need to run per file.
        shouldMinify: false,
        // Output is always esm since
        // format will be handled by rollup.
        output: 'esm',
        // Replace NODE_ENV and remove deadcode
        transforms: new Set(['nodeenv', 'deadcode']),
      });
    },
  };
}
