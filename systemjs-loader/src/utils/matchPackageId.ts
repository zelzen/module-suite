import { moduleUrl } from '../constants';

const packageUrlFormat = /^\/?((?:@[^/@]+\/)?[^/@]+)(?:@([^/?]+))?(?:\?.*)?(\/.*)?$/;

type Match<T> =
  | [
      /** Original Match */
      T,
      /** Package Name */
      string,
      /** Version */
      string,
      /** Path */
      string
    ]
  | null;

/**
 * Extracts package name, version, and path
 * from URL identifier.
 */
export default function matchPackageId<T extends string>(id: T): Match<T> {
  if (id.startsWith(moduleUrl) === false) return null;

  // TODO: Get moduleUrl from regex. Ugggh
  const importSpecifier = id.slice(moduleUrl.length);
  const match = packageUrlFormat.exec(importSpecifier) as Match<T>;

  return match;
}
