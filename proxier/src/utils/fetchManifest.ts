import { PackageJson, Repository } from 'shared/models/packageJson';
import { parseJsonBody } from './request';
import { getArtifactory as get } from './request/agents';

// https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#abbreviated-version-object
export type AbbreviatedPackageJson = {
  name: PackageJson['name'];
  version: PackageJson['version'];
  deprecated: PackageJson['deprecated'];
  dependencies: PackageJson['dependencies'];
  devDependencies: PackageJson['devDependencies'];
  peerDependencies: PackageJson['peerDependencies'];
  optionalDependencies: PackageJson['optionalDependencies'];
  /** Git commit sha from push */
  gitHead?: string;
  dist: {
    /** Download URL */
    tarball: string;
    shasum: string;
  };
};

export type Manifest = {
  name: string;
  description?: string;
  /** Dist tags are pointers to versions */
  'dist-tags': {
    latest: string;
    [tag: string]: string;
  };
  versions: {
    [version: string]: AbbreviatedPackageJson;
  };
  /** Version publish timestamps  */
  time: {
    /** When package was created */
    created: string;
    /** When package was last modified */
    modified: string;
    [version: string]: string;
  };
  /** Repository URI location */
  repository: Repository;
  license?: string;
};

const requestOptions = {
  headers: {
    // Use Abbreviated NPM metadata
    accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
    // Mock the referrer to enable abbreviated package json data.
    // Artifactory current doesn't support
    // just the accept header.
    // https://www.jfrog.com/jira/browse/RTFACT-18398
    referer: 'install npm-proxy',
  },
};

/**
 * Fetches abbreviated package manifest file.
 * https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#abbreviated-metadata-format
 */
export default async function fetchManifest(registryUrl: string, pkgName: string) {
  try {
    const res = await get(encodeURI(`${registryUrl}/${pkgName}`), requestOptions);
    const data = await parseJsonBody<Manifest>(res);
    return data;
  } catch (err) {
    console.error(`Error fetching ${pkgName} manifest`, err);
    // Re-throw error
    throw err;
  }
}
