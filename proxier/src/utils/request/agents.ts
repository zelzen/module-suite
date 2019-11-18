import { Agent } from 'https';
import { RequestOptions } from 'http';
import get from './get';

export const artifactoryAgent = new Agent({
  keepAlive: true,
});

export function getArtifactory(url: string, options?: RequestOptions) {
  return get(url, {
    agent: artifactoryAgent,
    ...options,
  });
}
