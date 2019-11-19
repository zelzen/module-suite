import semver from 'semver';
import System from './system';
import matchPackageId from './utils/matchPackageId';
import { setVersion } from './utils/moduleCache';

const systemSet = System.constructor.prototype.set;

/**
 * Caches version in module cache when `System.set` is used.
 */
function cacheSetVersion(id: string, module: any) {
  const match = matchPackageId(id);

  if (match !== null) {
    const [_, packageName, version] = match;
    if (semver.valid(version) === null) {
      throw new Error(
        `Attempted to set version "${version}" for "${packageName}". Ranges are invalid. Only exact versions can be set.`
      );
    }
    console.log('SET', packageName, version);

    setVersion(packageName, version);
  }

  return systemSet.call(System, id, module);
}

System.constructor.prototype.set = cacheSetVersion;
