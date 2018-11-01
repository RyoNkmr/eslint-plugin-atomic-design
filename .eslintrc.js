const resolve = require('path').resolve;

module.exports = {
  plugins: ['import'],
  rules: {
    'hierarchical-import': 2,
  },
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      alias: [
        ['@', resolve(__dirname, './examples')],
        ['@@', resolve(__dirname, '.')],
      ],
    },
  },
};
