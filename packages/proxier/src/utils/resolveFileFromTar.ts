import path from 'path';
import tar, { Headers } from 'tar-stream';
import bufferToStream from './bufferToStream';

function stripLeadingSegment(name: string) {
  return name.replace(/^[^/]+\/?/, '');
}

type Entry = {
  name: string;
  type: NonNullable<Headers['type']>;
  lastModified?: string;
  size?: number;
  content?: Buffer;
};

type FoundEntry = Entry & {
  size: number;
  content: Buffer;
};
/**
 * Downloads and resolves a file from a tarball
 *
 * @param tarballUrl - Tarball URL to download
 * @param entryName - File entry to reesolve
 */
export default async function resolveFileFromTar(tarBuffer: Buffer, entryName: string) {
  return new Promise<FoundEntry>((resolve, reject) => {
    // Normalize entry name
    // e.g. "./index.js" => "index.js"
    entryName = path.normalize(entryName);
    // If entryName starts with "/" remove it.
    // e.g. /cjs/react.production.js => cjs/react.production.js
    if (entryName.startsWith('/')) entryName = entryName.slice(1);

    const tarStream = bufferToStream(tarBuffer).pipe(tar.extract());

    const entries: Record<string, Entry> = {};
    let foundEntry: FoundEntry | null = null;

    // if (entryName === '') {
    //   foundEntry = entries[''] = { name: '', type: 'directory' };
    // }

    tarStream
      .on('error', (e: Error) => {
        console.error('tar stream error', e);
        reject(e);
      })
      .on('finish', () => {
        // console.log({ entries, foundEntry });
        if (foundEntry === null) {
          reject(new Error(`Unable to find file entry ${entryName}`));
        } else {
          resolve(foundEntry);
        }
      })
      .on('entry', (headers, stream, next) => {
        // Most packages have header names that look like `package/index.js`
        // so we shorten that to just `index.js` here. A few packages use a
        // prefix other than `package/`. e.g. the firebase package uses the
        // `firebase_npm/` prefix. So we just strip the first dir name.
        const name = stripLeadingSegment(headers.name);
        // console.log({ name, entryName })

        // We are only interested in files that match the entryName.
        if (headers.type !== 'file' || name.indexOf(entryName) !== 0) {
          stream.resume();
          stream.on('end', next);
          return;
        }

        const entry: Entry = {
          name,
          type: headers.type,
        };
        // console.log('headers', headers);

        entries[entry.name] = entry;

        // Dynamically create "directory" entries for all directories
        // that are in this file's path. Some tarballs omit these entries
        // for some reason, so this is the brute force method.
        let dirname = path.dirname(entry.name);
        while (dirname !== '.') {
          const directoryEntry = { name: dirname, type: 'directory' } as const;

          if (!entries[dirname]) {
            entries[dirname] = directoryEntry;

            // Support filenames which are directories
            // e.g. `lib` => `lib/index`
            if (directoryEntry.name === entryName) {
              // If entryName matches a directory,
              // we are looking for a `index` file inside that dir.
              entryName = path.join(directoryEntry.name, 'index');
            }
          }

          dirname = path.dirname(dirname);
        }

        // Set the foundEntry variable if this entry name
        // matches exactly or if it's an index.html file
        // and the client wants HTML.
        if (
          entry.name === entryName ||
          // Support filenames which leave off the `.js`
          // This matches NodeJS which will auto resolve
          // to `.js` if it is missing when using `require()`.
          //
          // This solves the case where packages leave off
          // the `.js` portion of the extensions such as:
          //   - /core-js@2.6.9/library/modules/es6.object.assign
          //   - /draft-js@0.11.1/lib/DraftEditor.react
          entry.name === `${entryName}.js`
          // // Allow accessing e.g. `/index.js` or `/index.json` using
          // // `/index` for compatibility with CommonJS
          // (!wantsIndex && entry.name === `${entryName}.js`) ||
          // (!wantsIndex && entry.name === `${entryName}.json`)
        ) {
          // @ts-ignore
          foundEntry = entry;
        }

        const chunks: Array<Uint8Array> = [];

        stream
          .on('data', (chunk: Uint8Array) => chunks.push(chunk))
          .on('end', () => {
            const content = Buffer.concat(chunks);

            if (headers.mtime) entry.lastModified = headers.mtime.toUTCString();
            entry.size = content.length;

            // Set the content only for the foundEntry and
            // discard the buffer for all others.
            if (entry === foundEntry) {
              entry.content = content;
            }

            next();
          });
      });
  });
}
