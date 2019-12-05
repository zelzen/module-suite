// Based on unpkg
// https://github.com/unpkg/unpkg.com/blob/master/modules/utils/parsePackageURL.js
import url from 'url';
import { ParsedUrlQuery } from 'querystring';

export type PackageDec = {
  pathname: string;
  search: string;
  query: ParsedUrlQuery;
  packageName: string;
  packageVersion: string;
  fileName: string;
};

const packageUrlFormat = /^\/?((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?(\/.*)?$/;

export default function parsePackageURL(originalURL: string): PackageDec | null {
  let { pathname, search, query } = url.parse(originalURL, true);
  if (pathname == null) return null;

  try {
    pathname = decodeURIComponent(pathname);
  } catch (error) {
    return null;
  }

  const match = packageUrlFormat.exec(pathname);

  // Disallow invalid URL formats.
  if (match == null) {
    return null;
  }

  const [_, packageName, packageVersion = 'latest', fileName = ''] = match;

  return {
    // If the URL is /@scope/name@version/file.js?main=browser
    pathname, // /@scope/name@version/path.js
    search: search || '', // ?main=browser
    query, // { main: 'browser' }
    packageName, // @scope/name
    packageVersion, // version
    fileName, // /file.js
  };
}
