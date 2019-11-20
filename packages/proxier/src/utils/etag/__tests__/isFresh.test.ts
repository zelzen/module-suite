/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingMessage, ServerResponse } from 'http';
import isFresh from '../isFresh';
import createEtag from '../createEtag';

type Headers = { [name: string]: string };

// @ts-ignore
const createRequest = (headers: Headers): IncomingMessage => ({
  headers,
});

const createReply = (headers: Headers): ServerResponse => {
  // @ts-ignore
  return {
    getHeader: (name: string) => headers[name],
    hasHeader: (name: string) => typeof headers[name] !== 'undefined',
  };
};

const etag = createEtag('cool etag');

it('should return true when etag is same', () => {
  const reqHeaders = createRequest({ 'if-none-match': etag });
  const replyHeaders = createReply({ etag });

  expect(isFresh(reqHeaders, replyHeaders)).toBe(true);
});

it('should return false when etag is not the same', () => {
  const reqHeaders = createRequest({ 'if-none-match': etag });
  const replyHeaders = createReply({ etag: createEtag('new etag') });

  expect(isFresh(reqHeaders, replyHeaders)).toBe(false);
});
