import { stringLiteral, booleanLiteral } from '@babel/types';
import { Transformer } from '../models';

export default <Transformer>function transformNodeEnv({ shouldMinify, transforms }) {
  // TODO: This can be done by a higher order function by specifying a transform name
  if (transforms.has('nodeenv') === false) return {};

  const value = shouldMinify ? 'production' : 'development';

  return {
    visitor: {
      MemberExpression(path) {
        const { parentPath } = path;

        if (path.matchesPattern('process.env.NODE_ENV')) {
          // Replace node env
          // e.g. "process.env.NODE_ENV" => "production"
          path.replaceWith(stringLiteral(value));

          if (parentPath.isBinaryExpression()) {
            const evaluated = parentPath.evaluate();
            // Replace with literal boolean value
            // e.g. "production" === "production" => true
            if (evaluated.confident) {
              path.parentPath.replaceWith(booleanLiteral(evaluated.value));
            }
          }
        }
      },
    },
  };
};
