import System from './system';
import { context } from './constants';

function setModuleServerHost(host: string) {
  if (host.startsWith('http') === false) {
    throw new Error(`Module Server Host must be a fully qualified url. Received "${host}"`);
  }
  context.host = host;
}

System.constructor.prototype.setModuleServerHost = setModuleServerHost;
