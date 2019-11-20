import fetchManifest from './fetchManifest';

export default async function findPackageTarFile(
  registryUrl: string,
  name: string,
  version: string
) {
  const manifest = await fetchManifest(registryUrl, name);
  return manifest.versions[version].dist.tarball;
}
