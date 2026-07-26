'use strict';

const js = require('@eslint/js');
const globals = require('globals');

/** このリポジトリ自身を lint するための設定 (ESLint flat config) */
module.exports = [
  {
    ignores: [
      'coverage/**',
      // 意図的に違反を含むフィクスチャ
      'tests/files/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
];
