import { PackageJson } from '../../models/packageJson';

export default function parsePackageJson(pkgJson: string): PackageJson {
  // TODO: Use fast json parser
  return JSON.parse(pkgJson);
}
