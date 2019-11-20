import { PackageJson, Dependencies } from '../../models/packageJson';

/**
 * Gets all dependencies expect devDependencies
 *
 * @param pkg - Package Json
 */
export default function getAllProdDependencies(pkg: PackageJson): Dependencies {
  return {
    ...pkg.dependencies,
    ...pkg.peerDependencies,
  };
}
