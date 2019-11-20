// @ts-ignore
import deadCodeElimination from 'babel-plugin-minify-dead-code-elimination';
import { Transformer } from '../models';

/**
 * This is for removing code transformed by "transformNodeEnv",
 * because some libraries decided which code to load via a process.env.NODE_ENV check.
 * See React (https://unpkg.com/react@16.8.6/index.js)
 *
 * TODO: Investigate doing this remove in "transformNodeEnv".
 * dead-code-elimination is pretty expensive and evaluates more than we care about.
 * https://github.com/babel/minify/blob/master/packages/babel-plugin-minify-dead-code-elimination/src/index.js#L865
 */
const deadCodeEliminationPlugin = [
  deadCodeElimination,
  {
    keepFnArgs: true,
    keepFnName: true,
    keepClassName: true,
  },
];

export default <Transformer>function transformDeadCodeElimination({ transforms }) {
  // TODO: This can be done by a higher order function by specifying a transform name
  if (transforms.has('deadcode') === false) return {};

  return deadCodeEliminationPlugin;
};
