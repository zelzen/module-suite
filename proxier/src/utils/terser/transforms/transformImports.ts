import { normalize, dirname } from 'path';
import { AST_Import, AST_Export } from 'terser';
import semver from 'semver';
import parsePackageUrl from 'shared/utils/packageJson/parsePackageUrl';
import { Transformer } from '../models';

const isSecure = true;
const protocol = isSecure ? 'https' : 'http';

/**
 * Rewrites package imports to point to this server.
 *
 * @example
 * "import React from 'react' => import React from 'https://node-proxy.exmaple.com/react'"
 *
 * @param host
 * @param packageName - Name of current package
 * @param packageVersion - Version of current package
 * @param currentFile - Current Referenced File Name
 * @param dependencies - Dependency keys and version values
 */

export default <Transformer>(
  function transformImports(
    { host, packageName, packageVersion, currentFile, dependencies },
    node
  ) {
    if (node instanceof AST_Import || node instanceof AST_Export) {
      const moduleName = node.module_name;
      /**
       * If there is no imported module, return out.
       * This would be the case for in plain exports
       *
       * @example
       * ```js
       * const name = 'react';
       *
       * export { name }
       * ```
       */
      if (moduleName == null) return;

      const importFilePath = moduleName.value;
      const importedModule = parsePackageUrl(importFilePath);
      if (importedModule === null) {
        throw `[AST] Unable to parse import declaration: "${importFilePath}"`;
      }
      const basePath = `${protocol}://${host}`;

      // Local imports
      if (importFilePath.startsWith('.')) {
        // Reference the same starting dir if a local path
        let importDir = dirname(currentFile);
        importDir = importDir === '.' || importDir === '/' ? '' : `/${importDir}`;

        moduleName.value = normalize(
          `${basePath}/${packageName}@${packageVersion}${importDir}/${importFilePath}`
        );
      }
      // External Package Imports
      else {
        const { packageName: importedPackageName, fileName } = importedModule;
        let importedModuleVersion = dependencies[importedPackageName];
        if (importedModuleVersion == null) {
          throw `[AST] Imported Module "${importedPackageName}" not listed as a dependency or peerDependency`;
        }
        // TODO: Support Semver Ranges. This will need changes in retrievePackage to search semver from artifactory
        // Floor the semver version
        importedModuleVersion = (semver.minVersion(importedModuleVersion) as semver.SemVer).version;

        moduleName.value = normalize(
          `${basePath}/${importedPackageName}@${importedModuleVersion}${fileName}`
        );
      }

      return node;
    }
  }
);
