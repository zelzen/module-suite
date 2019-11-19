import { Agent } from 'https';
import { RequestOptions } from 'http';
import get from './get';

export const registryAgent = new Agent({
  keepAlive: true,
});

export function getRegistry(url: string, options?: RequestOptions) {
  return get(url, {
    agent: registryAgent,
    ...options,
  });
}
