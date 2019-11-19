module.exports = (api) => {
  api.cache(() => process.env.NODE_ENV);
  return {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    plugins: [
      '@babel/plugin-transform-typescript',
      '@babel/plugin-proposal-class-properties',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            shared: '../shared',
          },
        },
      ],
    ],
  };
};
