import transformCommonjs from '@zelz/babel-plugin-transform-commonjs';
import { Transformer } from '../models';

export default <Transformer>function transformCjsToEsm({ output }) {
  // Don't transform to ESM if
  // not the specified output
  // Also transform for SystemJS since
  // the amd transform needs ES Modules.
  if (output !== 'esm' && output !== 'system') return {};

  return transformCommonjs;
};
