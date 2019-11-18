import { http, https } from 'follow-redirects';
import { IncomingMessage, RequestOptions } from 'http';
import { requestTimeout } from '../../constants';
import formatURL from './formatUrl';

/**
 * Request Adapters
 */
const adapters = {
  'http:': http,
  'https:': https,
} as const;

/**
 * Used for proxyRequests.
 * Use one the lower level http apis
 * if you need something different.
 *
 * This function will choose between using
 * "http" or "https" for making an request
 * based on the protocol of the passed string.
 */
export default function get(inputUrl: string, options?: RequestOptions) {
  return new Promise<IncomingMessage>((resolve, reject) => {
    // Parse the passed inputURL string.
    const { protocol, host, path } = formatURL(inputUrl);

    if (protocol !== 'https:' && protocol !== 'http:') {
      reject(`request protocol is not either 'http' or 'https'. url: ${inputUrl}`);
      return;
    }

    adapters[protocol]
      .get(
        {
          // rejectUnauthorized,
          protocol,
          host,
          path,
          timeout: requestTimeout,
          ...options,
        },
        resolve
      )
      .on('error', reject);
  });
}
