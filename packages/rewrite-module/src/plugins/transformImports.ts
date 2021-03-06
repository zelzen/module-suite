import { dirname } from 'path';
import { ParserOptions } from '@babel/core';
import { StringLiteral, Identifier } from '@babel/types';
import { createUrl } from '@module-suite/create-url';
import parsePackageUrl from 'shared/utils/packageJson/parsePackageUrl';
import isLocalIdentifier from 'shared/utils/isLocalIdentifier';
import { Context, Transformer } from '../models';

function rewriteValue(
  node: StringLiteral,
  { host, packageName, packageVersion, currentFile, dependencies, output }: Context
) {
  const importFilePath = node.value;
  if (importFilePath.startsWith('http')) {
    // Ignore already fully specified url imports
    return;
  }

  const importedModule = parsePackageUrl(importFilePath);
  if (importedModule === null) {
    throw `[AST] Unable to parse import declaration: "${importFilePath}". Imported from ${packageName}@${packageVersion}`;
  }

  // TODO: Source is the default but this module wouldn't know that.
  const importOutput = output === 'source' ? undefined : output;

  // Local imports
  if (isLocalIdentifier(node.value)) {
    // Reference the same starting dir if a local path
    let importDir = dirname(currentFile);
    // If import dir is referencing the same
    // directory, set it to an empty string.
    importDir = importDir === '.' || importDir === '/' ? '' : `/${importDir}`;

    node.value = createUrl(packageName, packageVersion, {
      host,
      filePath: `${importDir}/${importFilePath}`,
      output: importOutput,
    });
  }
  // External Package Imports
  else {
    const { packageName: importedModuleName, fileName } = importedModule;
    let importedModuleVersion = dependencies[importedModuleName];
    if (importedModuleVersion == null) {
      // Change to any support any version
      // While it would be nice for every package to have proper package.json dependencies,
      // sometimes the proxied packages may be 3rd party or out of our control
      importedModuleVersion = '*';
      // TODO: Maybe add this warning to the request?
      // Would make it easy to catch with CI
      // e.g. x-proxy-warnings: ...
      console.warn(
        `[AST] Imported Module "${importedModuleName}" not listed as a dependency or peerDependency`
      );
    }
    // TODO: What should we do if semver range is complex?
    // e.g. "1.x || >=2.5.0 || 5.0.0 - 7.2.3"
    // Maybe url encode it and allow the redirect semver range resolver handle it?

    node.value = createUrl(importedModuleName, importedModuleVersion, {
      host,
      filePath: fileName,
      output: importOutput,
    });
  }
}

export default <Transformer>function transformImports(context: Context) {
  // TODO: This can be done by a higher order function by specifying a transform name
  if (context.transforms.has('imports') === false) return {};

  return {
    manipulateOptions(_opts, parserOpts: ParserOptions) {
      if (parserOpts.plugins == null) return;
      // Support esm proposals
      parserOpts.plugins.push(
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'importMeta'
      );
    },

    visitor: {
      ImportDeclaration(path) {
        rewriteValue(path.node.source, context);
      },
      CallExpression(path) {
        const { node } = path;
        const { callee } = node;
        const { type } = callee;
        if (
          // Handle dynamic imports
          // e.g. import(react)
          type !== 'Import' &&
          // Transform require calls
          // These will later be transformed into import
          // statements by babel-plugin-transform-commonjs
          (callee as Identifier).name !== 'require'
        ) {
          // Some other function call
          return;
        }

        rewriteValue(node.arguments[0] as StringLiteral, context);
      },
      ExportAllDeclaration(path) {
        rewriteValue(path.node.source, context);
      },
      ExportNamedDeclaration(path) {
        if (path.node.source === null) {
          // This export has no "source", so it's probably
          // a local variable or function, e.g.
          // export { varName }
          // export const constName = ...
          // export function funcName() {}
          return;
        }

        rewriteValue(path.node.source, context);
      },
    },
  };
};
