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
  try {
    // Return out if we don't have a fully qualified url
    if (id.startsWith('http') === false) return null;
    const { pathname } = new URL(id);
    const match = packageUrlFormat.exec(pathname) as Match<T>;

    return match;
  } catch (err) {
    return null;
  }
}
