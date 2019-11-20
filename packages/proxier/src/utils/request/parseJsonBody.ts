import { IncomingMessage } from 'http';

type JsonObject = Record<string, any>;

export default function parseJsonBody<T = JsonObject>(response: IncomingMessage) {
  return new Promise<T>((resolve, reject) => {
    const data: Array<Uint8Array> = [];

    response.on('data', (chunk) => {
      data.push(chunk);
    });

    response.on('end', () => {
      try {
        const content = Buffer.concat(data).toString('utf8');
        resolve(JSON.parse(content));
      } catch (err) {
        reject(err);
      }
    });
  });
}
