import { normalize } from 'path';
import qs from 'qs';
import { ProxyOptions } from './models';

/**
 * Creates an import url for Module Server
 *
 * @param moduleName - Name of module (npm package name)
 * @param moduleVersion - Version of module. Can be a SEMVER range.
 * @param options - Query and Path options for url
 */
export default function createUrl(
  moduleName: string,
  moduleVersion: string,
  { filePath, minify, host, output, transforms }: ProxyOptions
) {
  if (!host || host.startsWith('http') === false) {
    throw new Error(`Expected host to be a valid URL. Received "${host}"`);
  }

  const queryParams = qs.stringify(
    {
      minify,
      // "source" is the default
      output: output === 'source' ? undefined : output,
      // Pass `transforms=false` if an empty Array is specified.
      transforms: !!transforms && transforms.length === 0 ? false : transforms,
    },
    { arrayFormat: 'comma' }
  );

  let path = `/${moduleName}@${moduleVersion}`;
  if (filePath) path += `/${filePath}`;
  if (queryParams) path += `?${queryParams}`;

  return host + normalize(path);
}
