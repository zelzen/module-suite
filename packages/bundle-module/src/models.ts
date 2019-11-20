import { Dependencies } from 'shared/models/packageJson';

export type Context = {
  /** Name of current package */
  packageName: string;
  /** Version of current package */
  packageVersion: string;
  /** If should minify bundle output */
  shouldMinify?: boolean;
  format?: 'esm' | 'system';
  /** Dependency keys and version values */
  dependencies: Dependencies;
  /** Host Address */
  host: string;
  /** File path of passed in code. This should _not_ include the url */
  rootFilePath: string;
};
