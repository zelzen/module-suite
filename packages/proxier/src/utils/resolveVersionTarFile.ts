import { Manifest } from './fetchManifest';

/**
 * Resolves a tarball for a given version
 */
export default function resolveVersionTarFile(manifest: Manifest, version: string) {
  const res = manifest.versions[version];
  if (res == null) {
    throw new Error(`Unable to resolve tarball for ${manifest.name} @ "${version}`);
  }
  return res.dist.tarball;
}
