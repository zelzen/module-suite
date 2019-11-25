import { transformAsync as transform, TransformOptions } from '@babel/core';
// @ts-ignore
import syntaxDynamicImportPlugin from '@babel/plugin-syntax-dynamic-import';
import transformNodeEnv from './plugins/transformNodeEnv';
import transformDeadCodeElimination from './plugins/transformDeadCodeElimination';
import transformCjsToEsm from './plugins/transformCjsToEsm';
import transformImports from './plugins/transformImports';
import transformEsmToSystemjs from './plugins/transformEsmToSystemjs';
import minify from './minify';
import { Context, Transformer } from './models';

const transformOptions: TransformOptions = {
  ast: false,
  configFile: false,
  babelrc: false,
  envName: 'production',
  minified: false,
  sourceMaps: false,
  retainLines: false,
  sourceType: 'unambiguous',
  shouldPrintComment(comment) {
    if (
      // Keep "PURE" comments.
      // These are hints to minifiers,
      // that the call is pure and _could_ be
      // removed with no side effects.
      comment === '#__PURE__' ||
      comment === '@__PURE__' ||
      // Keep @preserve comments
      comment.includes('@preserve')
    ) {
      return true;
    }

    // Remove all other comments.
    // These comments may include organizational info,
    // sensitive info (hopefully not), or other thing like
    // Gitlab urls we would rather not publicly expose.
    return false;
  },
};

// Babel Transforms to perform.
// Order is important here
const transforms: Array<Transformer> = [
  transformNodeEnv,
  transformDeadCodeElimination,
  transformCjsToEsm,
  transformEsmToSystemjs,
  transformImports,
];

const createPlugins = (context: Context) => transforms.map((transformer) => transformer(context));

export default async function rewriteModule(code: string, context: Context) {
  const options: TransformOptions = {
    ...transformOptions,
    filename: context.currentFile,
    plugins: [syntaxDynamicImportPlugin, ...createPlugins(context)],
  };

  const result = await transform(code, options);
  let transformedCode: string;

  if (result === null || result.code == null) {
    throw new Error(`Unknown error transforming ${context.packageName}@${context.packageVersion}`);
  }
  transformedCode = result.code;

  if (context.shouldMinify) {
    try {
      // TODO: Add timeout for 60 seconds for minification
      transformedCode = minify(result.code);
    } catch (err) {
      // Log error and return the babel transformed code
      // Babel has already done some minification.
      console.error(`Terser error minifying ${context.packageName}@${context.packageVersion}`, err);
    }
  }

  return {
    code: transformedCode,
    warnings: [],
  };
}
