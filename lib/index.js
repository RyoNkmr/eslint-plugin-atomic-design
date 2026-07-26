/**
 * @fileoverview atomic design rules
 * @author ryonkmr
 */
'use strict';

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

const { name, version } = require('../package.json');
const hierarchicalImport = require('./rules/hierarchical-import');

/** @type {import('./index').AtomicDesignPlugin} */
const plugin = {
  meta: { name, version },
  rules: {
    'hierarchical-import': hierarchicalImport,
  },
  configs: {},
};

Object.assign(plugin.configs, {
  // flat config (ESLint 9 / 10)
  recommended: {
    name: 'atomic-design/recommended',
    plugins: { 'atomic-design': plugin },
    rules: {
      'atomic-design/hierarchical-import': 'error',
    },
  },
  // eslintrc (.eslintrc.*) 互換。ESLint 10 では利用できない
  'recommended-legacy': {
    plugins: ['atomic-design'],
    rules: {
      'atomic-design/hierarchical-import': 'error',
    },
  },
});

module.exports = plugin;
