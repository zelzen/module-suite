import createUrl from './createUrl';
import { ProxyOptions } from './models';

type Dependencies = Record<string, string>;
type Options<T> = Omit<ProxyOptions, 'filePath'> & {
  filePaths?: Partial<Record<keyof T, string>>;
};

/**
 * Creates an import url for each dependency.
 *
 * @param deps - Dependencies object, normally from package.json
 * @param options - Additional options for `createUrl`
 */
export default function createDependencyUrls<T extends Dependencies>(
  dependencies: T,
  { filePaths = {}, ...options }: Options<T>
) {
  type Imports = Record<keyof T, string>;

  // Create import url for each entry
  // Use Object.keys to support IE 11
  return Object.keys(dependencies).reduce((accumDeps, moduleName) => {
    const moduleVersion = dependencies[moduleName];
    const importDec = createUrl(moduleName, moduleVersion, {
      ...options,
      filePath: filePaths[moduleName],
    });

    // @ts-ignore
    accumDeps[moduleName] = importDec;

    return accumDeps;
  }, {} as Imports);
}
