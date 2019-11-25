import terser, { MinifyOptions } from 'terser';

const terserOptions: MinifyOptions = {
  module: true,
  // Compress Options
  // See: https://terser.org/docs/api-reference#compress-options
  // compress: {
  //   ecma: 8,
  //   // Keep booleans as boolean values (true | false)
  //   // instead of (1 | 0)
  //   booleans_as_integers: false,
  // },
  // Terser Minify "Fast Mode"
  // https://terser.org/docs/api-reference#terser-fast-minify-mode
  compress: false,
  // Mangle Options
  // See: https://terser.org/docs/api-reference#mangle-options
  mangle: {
    safari10: true,
  },
  parse: {
    ecma: 8,
    // Modules do not support html comments
    html5_comments: false,
  },
  output: {
    comments: 'some',
  },
};

export default function minify(code: string): string {
  const minified = terser.minify(code, terserOptions);

  if (minified.error == null && minified.code) {
    return minified.code;
  }
  throw minified.error;
}
