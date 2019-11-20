import terser, { MinifyOptions } from 'terser';

const terserOptions: MinifyOptions = {
  module: true,
  // Speed up terser by ignoring removing whitespace
  // GZIP should take care of this (TODO: Verify this)
  compress: false,
  mangle: true,
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
