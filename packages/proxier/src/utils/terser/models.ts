import { TreeWalker, AST_Node } from 'terser';
import { Dependencies } from 'shared/models/packageJson';

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
};

export type Descend = ((node: AST_Node, tw: TreeWalker) => void) | undefined;
export type Transformer = (
  context: Context,
  node: AST_Node,
  descend: Descend
) => AST_Node | undefined;
