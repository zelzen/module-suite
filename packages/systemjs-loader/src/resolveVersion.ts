import semver from 'semver';
// @ts-ignore
import { intersect } from 'semver-intersect';
import System from './system';
import matchPackageId from './utils/matchPackageId';
import { resolveVersion, setVersion } from './utils/moduleCache';
import { context } from './constants';

const pendingVersions = new Map<string, [string, Promise<any>]>();
const systemResolve = System.constructor.prototype.resolve;

// TODO: System.resolve is no longer async as of v6
// https://github.com/systemjs/systemjs/pull/1996
// Figure out a better way to do this or see if using async would still work.
// It may still work in network lookups are async and local cache is async.
// I tried to mock System.import, but it isn't called for transitive dependencies.
function resolveImportVersion(id: string, parentUrl: string): string | Promise<string> {
  // Bail out if the supplied Module Server Host is invalid
  if (id.startsWith(context.host) === false) {
    return systemResolve.call(System, id, parentUrl);
  }
  const match = matchPackageId(id);

  // Bail out if no match
  if (match === null) return systemResolve.call(System, id, parentUrl);

  // If there is no version specified, default to anything
  const [_, packageName, version = '*', path = ''] = match;
  const pendingVersionId = packageName + path;
  // console.log('Loading', packageName, version);

  const isRange = semver.valid(version) == null && semver.validRange(version) !== null;

  // If an exact version is specified
  if (isRange === false) {
    setVersion(packageName, version);
    return systemResolve.call(System, id, parentUrl);
  }

  // Attempt to resolve version from module cache
  const resolvedVersion = resolveVersion(packageName, version);

  if (resolvedVersion !== null) {
    console.log(`[${parentUrl}] resolved ${packageName} from ${version} to ${resolvedVersion}`);
    // Replace with matched url id
    return systemResolve.call(
      System,
      id.replace(version, resolvedVersion),
      // `${moduleUrl}/${packageName}@${matchedVersion}${path}`,
      parentUrl
    );
  }

  if (pendingVersions.has(pendingVersionId)) {
    const [requestVersion, request] = pendingVersions.get(pendingVersionId) as [
      string,
      Promise<any>
    ];
    // console.log('has', packageName);
    try {
      // Check if the requested SemVer
      // and the current loading version intersect.
      // This will throw an error if false.
      // If version is any ("*") always use the pending version
      if (version !== '*') intersect(version, requestVersion);
      // console.log('using cached request', packageName, requestVersion, version);

      // Use the current request if the semver intersects
      return request.then((url) => {
        // Cache resolved version ID
        return resolveImportVersion(url, parentUrl);
      });
    } catch (err) {
      console.log(err, packageName, version);
    }
  }

  // TODO: This creates 3 request for the same resource.
  // One for the redirect,
  // the redirect follow (since there is no way to disable this without opaque headers),
  // and the actual script loading with `<script>` from SystemJS
  const request = fetch(id, {
    // Use HEAD method to prevent downloading content twice
    method: 'HEAD',
    // Module server will redirect to resolved absolute package url
    redirect: 'follow',
  })
    .then(({ url }) => {
      // Clean up pending version cache
      pendingVersions.delete(pendingVersionId);
      // If the url is the same we have an error
      if (url === id) throw new Error(`Unable to resolve version "${version}" for id ${id}`);
      // Return resolved url
      return url;
    })
    .catch((err) => {
      console.error(`Error resolving range version "${id}"`);
      throw err;
    });

  // Store semver range resolve request in cache
  // This only stores one request at a time.
  pendingVersions.set(pendingVersionId, [version, request]);

  return request.then((url) => {
    // Cache resolved version ID
    return resolveImportVersion(url, parentUrl);
  });
}

// Override System default resolver
System.constructor.prototype.resolve = resolveImportVersion;
