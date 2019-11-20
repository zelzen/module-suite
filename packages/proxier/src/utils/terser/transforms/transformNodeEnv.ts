import { AST_Dot, AST_String } from 'terser';
import { Transformer } from '../models';

/**
 * Transforms "process.env.NODE_ENV" declarations
 * to "production" if we shouldMinify, otherwise "development"
 */
export default <Transformer>function transformNodeEnv({ shouldMinify }, node) {
  const value = shouldMinify ? 'production' : 'development';

  if (node instanceof AST_Dot) {
    // TODO: Add "start" to type defs
    // @ts-ignore
    if (node.property === 'NODE_ENV' && node.start && node.start.value === 'process') {
      const newNode = new AST_String();
      newNode.value = value;
      return newNode;
    }
  }
};
