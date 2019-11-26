import semver from 'semver';

/**
 * Checks if semver is an exact version.
 * e.g. "16.6.8"
 *
 * This excludes ranges.
 */
export default function isExactSemver(version: string) {
  return semver.valid(version) !== null;
}
