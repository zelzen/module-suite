// Support AMD
// import 'systemjs/dist/extras/amd';

type Deps = Array<string>;
type RegisterDeclare = (execute: Function, context: any) => any;

export interface System {
  /**
   * This represents the System base class, which can be extended or reinstantiated to create a custom System instance.
   */
  constructor: new () => System;
  /**
   * Loads a module by name taking an optional normalized parent name argument.
   * Promise resolves to the module value.
   */
  import(moduleName: string, normalizedParentName?: string): Promise<any>;
  /**
   * Returns whether a given module exists in the registry by normalized module name.
   */
  has(moduleName: string): boolean;
  /**
   * Resolves module name to normalized URL.
   */
  resolve(moduleName: string, parentName?: string): Promise<string>;
  register(deps: Deps, execute: RegisterDeclare): void;
  getRegister(): [Deps, RegisterDeclare];
  version: string;
}

// Get SystemJS depending on node vs browser environment
// @ts-ignore
const system: System = typeof window === 'undefined' ? global.System : window.System;

export default system;
