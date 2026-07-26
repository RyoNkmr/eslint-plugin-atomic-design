'use strict';

const path = require('path');

const atomicDesign = require('../lib');

/**
 * このプラグインを実際に適用したときの設定例（dogfooding 用）。
 * examples/ 配下には意図的に違反しているファイルが含まれているため、
 * `npm run lint:examples` はエラーを報告するのが正しい挙動。
 */
module.exports = [
  atomicDesign.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    settings: {
      // エイリアスの解決方法は eslint-plugin-import(-x) と同じ設定を共有する
      'import/resolver': {
        './tools/import-resolver.js': {
          map: [
            ['@', path.resolve(__dirname)],
            ['@@', path.resolve(__dirname, '..')],
          ],
          extensions: ['.js', '.jsx'],
        },
      },
    },
  },
];
