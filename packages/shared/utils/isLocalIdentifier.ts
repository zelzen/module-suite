/**
 * Is ID referencing a local file path
 */
export default function isLocalIdentifier(id: string) {
  return id.startsWith('.') || id.startsWith('/');
}
