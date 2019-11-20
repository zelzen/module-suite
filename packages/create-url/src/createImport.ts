import { normalize } from 'path';
import qs from 'qs';
import semver from 'semver';
import { ProxyOptions } from './models';

/**
 * Creates an import for Module Server
 */
export default function createImport(
  moduleName: string,
  moduleVersion: string,
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
