import minify from '../minify';

it('should minify source code', () => {
  const code = `
  import React from 'react';

  function MyComponent() {
    return React.createElement('div', null, 'hello world');
  }

  function unusedFunc() {
    console.log('I do nothing an should be removed')
  }

  export default MyComponent
  `;

  expect(minify(code)).toMatchInlineSnapshot(
    `"import e from\\"react\\";export default function(){return e.createElement(\\"div\\",null,\\"hello world\\")}"`
  );
});

it('should preserve @preserve and @license comments', () => {
  const code = `
  /**
   * @license React
   */
  import React from 'react';

  /**
   * Rexport React
   * @preserve
   */
  export default React;
  `;

  expect(minify(code)).toMatchInlineSnapshot(`
    "/**
       * @license React
       */
    import r from\\"react\\";
    /**
       * Rexport React
       * @preserve
       */export default r;"
  `);
});
