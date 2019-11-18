import { TreeTransformer, AST_Node } from 'terser';
import { transformImports, transformNodeEnv } from './transforms';
import { Context, Transformer } from './models';

// TODO: We need a transform for converting
// shimming `module.exports` and converting `require` to imports.
const transforms: Array<Transformer> = [transformImports, transformNodeEnv];

const walkTransforms = (context: Context) =>
  new TreeTransformer((node, descend) => {
    for (const transform of transforms) {
      const res = transform(context, node, descend);
      if (res != null) return res;
    }
  });

export default function rewriteModule(ast: AST_Node, context: Context) {
  return ast.transform(walkTransforms(context));
}
