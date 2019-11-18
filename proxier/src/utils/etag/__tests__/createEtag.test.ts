import createEtag from '../createEtag';

it('should produce deterministic etags', () => {
  const name = 'this is an etag tag';
  expect(createEtag(name)).toBe(createEtag(name));
});

it('should be a weak etag', () => {
  const etag = createEtag('big ol etag right here');
  expect(etag.includes('W/')).toBe(true);
});

it('should trim spaces', () => {
  const formattedEtag = createEtag('etag');

  expect(createEtag('etag ')).toBe(formattedEtag);
  expect(createEtag('    etag ')).toBe(formattedEtag);
  expect(createEtag('e   tag')).not.toBe(formattedEtag);
});
