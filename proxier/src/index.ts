export { default } from './proxyModule';

// Force Rollup to recognize export as a type
// and remove it from the Javascript bundle
type OutputType = import('@module-suite/rewrite').OutputType;
type TransformType = import('@module-suite/rewrite').TransformType;
export { OutputType, TransformType };
