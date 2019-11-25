import semver from 'semver';
import { Manifest } from './fetchManifest';

export class VersionNotFoundError extends Error {
  name = 'VersionNotFoundError';
  constructor(packageName: string, version: string) {
    super(`Version "${version}" for package "${packageName}" could not be found`);
  }
}

/**
 * Resolves matching version from package manifest.
 * If version range, fetches the highest satisfying version.
 * If exact version, returns that exact version if exists in manifest.
 * If dist-tag such as "latest", returns the pointer version.
 * Version "*" will resolve to latest.
 *
 * @param manifest - Package manifest
 * @param version - Version specifier. Can be a range, dist-tag, or exact version
 */
export default function resolveVersion(manifest: Manifest, version: string): string {
  const { versions } = manifest;
  const distTags = manifest['dist-tags'];

  // If "any" version, use latest
  if (version === '*') {
    version = 'latest';
  }

  // Return matched dist-tag
  // This will match versions such as "latest" and "next"
  if (distTags[version]) {
    return distTags[version];
  }

  // Return if matched an exact version
  if (versions[version]) {
    return version;
  }

  // Find version if version range
  const versionsList = Object.keys(manifest.versions);
  const maxSatisfying = semver.maxSatisfying(versionsList, version);
  if (maxSatisfying == null) {
    throw new VersionNotFoundError(manifest.name, version);
  }

  return maxSatisfying;
}
