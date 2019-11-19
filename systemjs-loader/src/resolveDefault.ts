import System, { System as ISystem } from './system';

type Exports = Record<string, any>;
type PossibleExports = any | Exports;
const systemPrototype = System.constructor.prototype;
const originalGetRegister = systemPrototype.getRegister;

/**
 * Interop for AMD modules to return the direct AMD binding instead of a
 * `{ default: amdModule }` object from `System.import` or `System.register`
 */
System.constructor.prototype.getRegister = function getRegister() {
  const register: ReturnType<ISystem['getRegister']> = originalGetRegister.call(this);

  // otherwise it was provided by a custom instantiator
  // -> extend the registration with named exports support
  const originalRegisterDeclare = register[1];
  register[1] = function registerDeclare(_export, _context) {
    // let defaultExport: PossibleExports;
    // let hasDefaultExport = false;

    const declaration = originalRegisterDeclare.call(
      this,
      // Hook into the register function
      // to find the default export
      function interopRegister(name: string, value: PossibleExports) {
        if (name === 'default') {
          // console.log('interop', name, value)
          // Spread default exports on top level if object
          if (typeof value === 'object')
            for (const exportName in value) {
              // default is not a named export
              if (exportName !== 'default') {
                _export(exportName, value[exportName]);
              }
            }
        }
        // if (name === '__useDefault') hasDefaultExport = true;
        // Pass along export
        _export(name, value);
      },
      _context
    );

    return declaration;
  };

  return register;
};
