import { extname } from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import mimeTypes from 'mime-types';
import { createUrl } from '@module-suite/create-url';
import rewriteModule from '@module-suite/rewrite';
import bundleModule from '@module-suite/bundle';
import getAllDependencies from 'shared/utils/packageJson/getAllProdDependencies';
import parsePackageUrl from 'shared/utils/packageJson/parsePackageUrl';
import { OutputType, TransformType } from 'shared/models/options';
import resolveVersionTarFile from './utils/resolveVersionTarFile';
import resolveVersion from './utils/resolveVersion';
import fetchManifest from './utils/fetchManifest';
import resolveFileFromTar from './utils/resolveFileFromTar';
import { createEtag, isFresh } from './utils/etag';
import bundlingSupported from './utils/bundlingSupported';
import { defaultRegistryUrl } from './constants';

type Query = {
  minify?: boolean;
  bundle?: boolean;
  output?: OutputType;
  transforms?: Array<TransformType>;
};

type Options = {
  host: string;
  query?: Query;
  /* Fully qualified url of an NPM or compatible registry. Defaults to yarn registry */
  registry?: string;
};

const defaultTransforms = ['nodeenv', 'imports', 'deadcode'] as Array<TransformType>;

export default async function proxyModule(
  req: IncomingMessage,
  res: ServerResponse,
  { host, query = {}, registry: registryUrl = defaultRegistryUrl }: Options
) {
  const url = req.url as string;

  if (host == null) {
    console.error(`Host header was not provided: ${url}`);
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        statusCode: 400,
        error: 'Invalid Request',
        message: `Host header was not provided: ${url}`,
      })
    );
    return;
  }

  const dec = parsePackageUrl(url);
  if (dec === null) {
    console.error(`Could not parse package for url: ${url}`);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        statusCode: 500,
        error: 'Internal Server Error',
        message: `Could not parse package for url: ${url}`,
      })
    );
    return;
  }

  const { packageName, packageVersion } = dec;
  let { fileName } = dec;
  // If module entry point was requested
  // e.g. 'http://localhost:3030/react@16.8.6'
  const isEntryModuleSpecifier = fileName === '';

  const {
    minify: shouldMinify = true,
    bundle: bundlingRequested = false,
    output: outputModuleType = 'source',
    transforms = defaultTransforms,
  } = query;

  // Create a weak etag from package declaration and defaults
  const etag = createEtag(
    packageName + packageVersion + fileName + outputModuleType + shouldMinify
  );
  // Set etag header
  res.setHeader('etag', etag);

  // Return 304 (Not Modified) if request is fresh
  if (isFresh(req, res)) {
    res.statusCode = 304;
    res.end();
    return;
  }

  const manifest = await fetchManifest(registryUrl, packageName);

  try {
    // Resolves a semver range to an exact version
    const resolvedVersion = resolveVersion(manifest, packageVersion);
    // Redirect if the resolved version is different.
    // A redirect won't occur if the requested version is exact.
    if (resolvedVersion !== packageVersion) {
      // Cache redirect for 20 minutes.
      // This is how long it will take for a
      // package release to propagate out.
      // reply.header('Cache-Control', 'public, max-age=1200');
      // TODO: Play with this setting.
      // For active development I'm setting this to 3 hours
      res.setHeader('Cache-Control', 'public, max-age=10800');
      // Redirect to a definite resource url
      // so it the url can be immutably cached.
      // e.g. `react@^16.8.6 => react@16.8.6`
      res.statusCode = 302;
      res.setHeader(
        'Location',
        createUrl(packageName, resolvedVersion, {
          host,
          filePath: fileName,
          minify: shouldMinify === true ? undefined : false,
          output: outputModuleType,
          transforms: transforms.length === defaultTransforms.length ? undefined : transforms,
        })
      );
      return;
    }
  } catch (err) {
    console.error('Error resolving version for:', url, err);
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        statusCode: 400,
        error: 'Invalid semver version',
        message: `Requested semver version "${packageVersion}" is invalid`,
      })
    );
    return;
  }

  try {
    const packageJson = manifest.versions[packageVersion];

    // TODO: Support filenames which are directories
    // /es/proj
    //
    // TODO: Support filenames which leave off the `.js` (maybe don't support this..., have them fix it)
    // /es/shared/components/IframeFormSubmit.component
    //
    // Lookup package entry if filename is not provided
    if (fileName === '') {
      const pkg = packageJson;
      // Only support simple browser spec
      // https://github.com/defunctzombie/package-browser-field-spec#replace-specific-files---advanced
      const browserDec = typeof pkg.browser === 'string' && pkg.browser;
      fileName =
        // Use unpkg declaration first.
        // Unpkg is a npm proxy similar to ours,
        // so using this bundle is a good bet.
        pkg.unpkg ||
        // Browser field is before module / main because
        // if this is present, it implies a custom browser specific build.
        browserDec ||
        pkg.module ||
        pkg.main ||
        // File name defaults to index.js if none
        // is specified in the package.json
        // https://stackoverflow.com/a/22513200/6635914
        'index.js';
      // Add `.js` extension if not specified.
      // Node will auto resolve to `.js` if it is missing when using `require()`.
      if (extname(fileName) === '') fileName += '.js';
    }

    if (!fileName) {
      const error = `Could not find entry file for "${packageName}"`;
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          statusCode: 500,
          error: 'Internal Server Error',
          message: error,
        })
      );
      return;
    }

    let fileExt = extname(fileName);
    let mimeType = mimeTypes.contentType(fileExt);
    // If a filename has no resolved mimetype
    // default to the javascript extension.
    // Matches Node which will auto resolve
    // to `.js` if it is missing when using `require()`.
    //
    // This solves the case where packages leave off
    // the `.js` portion of the extensions such as:
    //   - /core-js@2.6.9/library/modules/es6.object.assign?output=system
    //   - /draft-js@0.11.1/lib/DraftEditor.react?output=system
    //
    // TODO: This logic should be superseded by downloading the
    // package tar file and searching for a correct matching file.
    if (mimeType === false) {
      fileExt = '.js';
      fileName += '.js';
      mimeType = 'application/javascript; charset=utf-8';
    }

    const tarFileUrl = resolveVersionTarFile(manifest, packageVersion);
    const fileContent = resolveFileFromTar(tarFileUrl, fileName)
      .then((entry) => {
        return entry.content.toString();
      })
      .catch((err) => {
        // Re-throw error
        throw err;
      });

    // Set file content-type.
    res.setHeader('Content-Type', mimeType);

    // Pass through non js files un-modified
    if (fileExt !== '.js') {
      // TODO: Use shared cache-control
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(await fileContent);
    }

    // All module dependencies
    const dependencies = getAllDependencies(packageJson);

    let transformedCode: string = '';
    console.log(
      `"${url}" bundlingRequested: ${bundlingRequested}, isEntryModuleSpecifier: ${isEntryModuleSpecifier}, supported: ${bundlingSupported(
        fileName,
        outputModuleType
      )}`
    );

    // Attempt to bundle module's local references
    //
    // This only should be attempted if the user has
    // opted in, is requesting a package entry point, and file and output type are supported.
    if (
      bundlingRequested &&
      isEntryModuleSpecifier &&
      bundlingSupported(fileName, outputModuleType)
    ) {
      console.log(`Attempting to bundle "${packageName}@${packageVersion}`);
      // Await code outside of try / catch to
      // avoid error from being swallowed.
      const code = await fileContent;
      try {
        // TODO: This only works with output='esm' currently since
        // rewriteModule rewrites all external imports too.
        // bundle-module probably needs to consume rewrite-module
        // with plain code from registry being passed in.
        const bundle = await bundleModule(code, {
          host,
          packageName,
          packageVersion,
          dependencies,
          shouldMinify,
          rootFilePath: fileName,
          format: outputModuleType,
        });

        if (bundle) {
          transformedCode = bundle;
        }
      } catch (err) {
        console.log(`Unable to bundle code for ${packageName} @ v${packageVersion}`, err);
      }
    }

    // If module shouldn't be bundled or bundling failed.
    if (transformedCode === '') {
      const module = await rewriteModule(await fileContent, {
        host,
        packageName,
        packageVersion,
        currentFile: fileName,
        output: outputModuleType,
        transforms: new Set(transforms),
        shouldMinify,
        dependencies,
      });

      transformedCode = module.code;
    }

    // Set cache expiration headers
    res.setHeader(
      'Cache-Control',
      // Cache for one year if ua query is supplied
      // Setting to "public" to allow Proxy server to cache request
      'public, max-age=31536000, immutable'
    );
    res.end(transformedCode);
  } catch (err) {
    console.error(`Error retrieving ${url}`, err);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message,
      })
    );
  }
}
