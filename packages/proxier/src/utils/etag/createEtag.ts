/**
 * Creates a base64 encoded weak etag
 * based on supplied tag
 *
 * @example
 * createEtag('cool etag') => 'W/"Y29vbCBldGFn"'
 */
export default function createEtag(tag: string): string {
  // eslint-disable-next-line no-param-reassign
  tag = tag.trim();
  return `W/"${Buffer.from(tag).toString('base64')}"`;
}
