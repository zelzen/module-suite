import fresh from 'fresh';

type IncomingMessage = import('http').IncomingMessage;
type ServerResponse = import('http').ServerResponse;

/**
 * Checks the etag and last-modified headers
 * to determine if the client has the latest
 */
export default function isFresh(request: IncomingMessage, res: ServerResponse): boolean {
  return fresh(request.headers, {
    etag: res.getHeader('etag'),
    'last-modified': res.getHeader('last-modified'),
  });
}
