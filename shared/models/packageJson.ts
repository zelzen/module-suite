export type Dependencies = Record<string, string>;
export type Repository =
  | string
  | {
      type: string;
      url: string;
      directory?: string;
    };

export type PackageJson = {
  name: string;
  description?: string;
  version: string;
  /** A mapping of bin commands */
  bin?: Record<string, string>;
  repository?: Repository;
  /** Message if package is deprecated */
  deprecated?: string;
  /** If module contains side-effects on import */
  sideEffects?: boolean;
  /** Commonjs Bundle */
  main?: string;
  /** ES Module bundle */
  module?: string;
  /** Custom browser supported bundle */
  browser?: string;
  /** Custom build for clients of unpkg */
  unpkg?: string;
  files?: Array<string>;
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  peerDependencies?: Dependencies;
  optionalDependencies?: Dependencies;
};
