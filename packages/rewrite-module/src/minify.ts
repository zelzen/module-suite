import terser, { MinifyOptions } from 'terser';

const terserOptions: MinifyOptions = {
  module: true,
  // Terser Minify "Fast Mode"
  // https://terser.org/docs/api-reference#terser-fast-minify-mode
  // Options: https://terser.org/docs/api-reference#compress-options
  compress: {
    ecma: 8,
    // Keep booleans as boolean values (true | false)
    // instead of (1 | 0)
    booleans_as_integers: false,
    arrows: false,
    booleans: false,
    // cascade: false,
    collapse_vars: false,
    comparisons: false,
    computed_props: false,
    hoist_funs: false,
    hoist_props: false,
    hoist_vars: false,
    if_return: false,
    inline: false,
    join_vars: false,
    keep_infinity: true,
    loops: false,
    negate_iife: false,
    properties: false,
    reduce_funcs: false,
    reduce_vars: false,
    sequences: false,
    side_effects: false,
    switches: false,
    // top_retain: false,
    toplevel: false,
    typeofs: false,
    unused: false,
    // Switch off all types of compression except those needed to convince
    // react-devtools that we're using a production build
    conditionals: true,
    dead_code: true,
    evaluate: true,
  },
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
