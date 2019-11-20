import createImport from './createImport';
import { ProxyOptions } from './models';

type Dependencies = Record<string, string>;
type Options<T> = Omit<ProxyOptions, 'filePath'> & {
  filePaths?: Partial<Record<keyof T, string>>;
};

export default function createDependencyImports<T extends Dependencies>(
  deps: T,
  { filePaths = {}, ...options }: Options<T>
) {
  type Imports = Record<keyof T, string>;

  return Object.entries(deps).reduce((accumDeps, [moduleName, moduleVersion]) => {
    const importDec = createImport(moduleName, moduleVersion, {
      ...options,
      filePath: filePaths[moduleName],
    });

    // @ts-ignore
    accumDeps[moduleName] = importDec;

    return accumDeps;
  }, {} as Imports);
}
