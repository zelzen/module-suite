import { extname } from 'path';
import { OutputType } from '@module-suite/rewrite';

/**
 * Checks if type and filetype supports bundling
 */
export default function bundlingSupported(
  fileName: string,
  outputModuleType: OutputType
): outputModuleType is 'esm' | 'system' {
  return outputModuleType !== 'source' && extname(fileName) === '.js';
}
