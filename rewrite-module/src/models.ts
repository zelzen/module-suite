import { PluginItem } from '@babel/core';
import { Dependencies } from 'shared/models/packageJson';

export type OutputType = 'source' | 'esm' | 'system';
export type TransformType = 'nodeenv' | 'imports' | 'deadcode';
export type Transforms = Set<TransformType>;

export type Context = {
  /** Host Address */
  host: string;
  /** Name of current package */
  packageName: string;
  /** Version of current package */
  packageVersion: string;
  /** Current Referenced File Name */
  currentFile: string;
  /** Dependency keys and version values */
  dependencies: Dependencies;
  /** If we should minify the output */
  shouldMinify: boolean;
  /** Requested output module type */
  output: OutputType;
  /** Requested transforms to perform */
  transforms: Transforms;
};

export type Transformer = (context: Context) => PluginItem;
