/**
 * 型定義が実際の使われ方で成立するかを tsc で検証するためのファイル。
 * 実行はされない（`npm run typecheck` の対象）。
 */
import type { Linter } from 'eslint';

import atomicDesign = require('../../lib');

// flat config にそのまま並べられること
const flatConfig: Linter.Config[] = [
  atomicDesign.configs.recommended,
  {
    files: ['src/**/*.js'],
    plugins: { 'atomic-design': atomicDesign },
    rules: {
      'atomic-design/hierarchical-import': [
        'error',
        {
          levels: ['atoms', 'molecules', '=organisms', ['templates', 'pages']],
          excludes: ['node_modules/\\w'],
          pathPatterns: ['components/(\\w+)/'],
          module: 'strict',
        } satisfies atomicDesign.HierarchicalImportOptions,
      ],
    },
  },
];

// eslintrc 形式の設定も型として取り出せること
const legacyConfig: Linter.LegacyConfig =
  atomicDesign.configs['recommended-legacy'];

export { flatConfig, legacyConfig };
