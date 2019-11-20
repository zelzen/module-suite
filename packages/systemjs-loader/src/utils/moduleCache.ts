import semver from 'semver';
import System from '../system';

export type AvailableVersions = Array<string>;
const loadedModules = new Map<string, AvailableVersions>();
// Expose on System
System.constructor.prototype.loadedModules = loadedModules;

/**
 * Resolves a version range from the cache
 */
export function resolveVersion(packageName: string, versionRange: string): string | null {
  if (loadedModules.has(packageName)) {
    const loadedVersions = loadedModules.get(packageName) as AvailableVersions;
    // Check if a matching version is loaded in cache
    return semver.maxSatisfying(loadedVersions, versionRange);
  }

  return null;
}

/**
 * Sets a version in the cache.
 * Version must be an exact version.
 */
export function setVersion(packageName: string, exactVersion: string): void {
  if (loadedModules.has(packageName)) {
    const versions = loadedModules.get(packageName) as AvailableVersions;
    // Return out if we already have this version
    // TODO: Use a set. It also prevents dups.
    if (versions.includes(exactVersion)) return;

    // Mutate the version array
    versions.push(exactVersion);
  } else {
    // Create initial module array for first entry
    loadedModules.set(packageName, [exactVersion]);
  }
}
