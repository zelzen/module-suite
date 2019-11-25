# Module Suite  

Suite for managing Javascript Modules on the Web.  

## Available Packages

### bundle-module  

`$ yarn add @module-suite/bundle`

Bundles locally referenced imports into a single bundled file with Rollup. 

**Example** 

```js
import bundle from '@module-suite/bundle'

const code = `
  import ReactDom from 'react-dom';
  import App from './App';
  
  function bootstrap(element) {
    return React.render(element, App)
  }
  
  export default bootstrap;
`

const bundleCode = bundle(code, {
  packageName: 'my-module',
  packageVersion: '1.0.0',
  // Any dependencies of this code. Should include peerDeps.
  dependencies: {
	  'react': '^16.8.6',
  	  'react-dom': '^16.8.6',
  },
  host: 'http://localhost:3030', // Module server host address
  shouldMinify: true, // If true, will minify with terser
  format: 'esm', // any format Rollup supports
  rootFilePath: './index.js', // For resolving local imports
  }
})
```



### create-url  

`$ yarn add @module-suite/create-url`

Creates Module Server / Proxier valid urls. Can be used for importing Module Server modules or transforming imports in a bundler such as Rollup, Webpack, or Parcel.  

**Example**

```js
import { createUrl, createDependencyUrls } from '@module-suite/create-url'

const url = createUrl('react', '16.8.6', {
  filePath: 'cjs/react.production.min.js', // Which file to use. Can be omitted to use module root.
  minify: false,
  host: 'http://localhost:3030',
  output: 'esm',
  transforms: ['nodeenv', 'deadcode', 'imports'] // Can also be true or false for specifying all or none transforms
}) // Url is `http://localhost:3030/react@16.8.6/cjs/react.production.min.js?output=esm&transforms=nodenv,deadcode,imports&minify=false

```

### proxier  

`$ yarn add @module-suite/proxier`

Proxy middleware for fetching and transforming modules.

**Example**  
Create a custom Module Server

```js
import express from 'express';
import proxier from '@module-suite/proxier';

const app = express();

app.get('/*', (request, response) => {
	// Open Cors
  response.set({
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET',
  });
  
  const { url } = request;
  const { host } = request.headers; // Could also be a forwarded host if using a CDN such as Cloudfront
  
  // Use secure protocol (https) if not running locally
  const hostWithProtocol = host.includes('localhost') ? `http://${host}` : `https://${host}`;
  
  return proxyModule(request, response, {
    host: hostWithProtocol,
    query: request.query,
    registry: 'https://registry.yarnpkg.com', // May also be a local or on premise internal registry
  });
})

app.start(3030, () => {
	console.log('App up at http://localhost:3030')
})
```

### rewrite-module  

`$ yarn add @module-suite/rewrite`

Rewrites module code with specified transforms and output types. Able to transform CJS to ESM, ESM to SystemJS, re-write `import` / `require` imports to use a Module Server, transform and remove `process.env.NODE_ENV` for better browser support, and bundle code with terser.  

### systemjs-loader  

`$ yarn add @module-suite/systemjs-loader`

A SystemJS plugin for resolving and caching Module Server module requests. Uses SEMVER specified in url to find a matching version already loaded, if any.  

### test-module  

`$ yarn add @module-suite/test`

Tests module using `package.json` to ensure compatibility with Module Server. Includes linting for best practices.  
