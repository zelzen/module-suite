// @ts-ignore
import transformModulesSystemjs from '@babel/plugin-transform-modules-systemjs';
import { Transformer } from '../models';

export default <Transformer>function transformEsmToSystemjs({ output }) {
  // Don't transform to system if
  // not the specified output
  // TODO: If a module is umd, this creates an incorrect systemjs module.
  // This may be a bug with transform-modules-systemjs or a side effect
  // of piping umds through commonjs to esm as well.
  //
  // A workaround could be to detect if the file is umd and default to `output=source`
  // because Systemjs can load umd bundles fine.
  // This may need to be done at the proxier level
  //
  // Could also try detection is it include amd (`define`) and bail out to 'source'.
  // umd bundles will include amd defines, and we don't support amd transforming anyway.
  if (output !== 'system') return {};

  return transformModulesSystemjs;
};
