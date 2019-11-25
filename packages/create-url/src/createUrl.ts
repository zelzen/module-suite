import { normalize } from 'path';
import qs from 'qs';
import semver from 'semver';
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
  // TODO: Default transforms to true.
  // TODO: Default output to source
  // TODO: Default minify to true
  // TODO: Default filePath to empty string
  { filePath, minify, host, output, transforms }: ProxyOptions
) {
  if (!host || host.startsWith('http') === false) {
    throw new Error(`Expected host to be a valid URL. Received "${host}"`);
  }

  const isValidSemver =
    semver.valid(moduleVersion) != null || semver.validRange(moduleVersion) != null;
  if (isValidSemver === false) {
    throw new Error(
      `Expected valid semver or range for "${moduleName}". Received: ${moduleVersion}`
    );
  }

  const queryParams = qs.stringify(
    {
      minify,
      output,
      // TODO: Allow transforms: true for transforms
      // Pass `transforms=false` if an empty Array is specified.
      transforms: transforms != null && transforms.length === 0 ? false : transforms,
    },
    { arrayFormat: 'comma' }
  );

  let path = `/${moduleName}@${moduleVersion}`;
  if (filePath) path += `/${filePath}`;
  if (queryParams) path += `?${queryParams}`;

  return host + normalize(path);
}
