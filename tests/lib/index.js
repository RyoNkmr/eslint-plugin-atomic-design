/**
 * @fileoverview プラグインのエントリポイントが flat config として機能することの検証
 */
'use strict';

const assert = require('assert');
const path = require('path');
const { ESLint } = require('eslint');

const plugin = require('../../lib');
const { version } = require('../../package.json');

const getFilePath = (...relativePath) =>
  path.join(__dirname, '..', 'files', ...relativePath);

const createESLint = () =>
  new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      plugin.configs.recommended,
      {
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
        },
        settings: {
          'import/resolver': {
            './tools/import-resolver.js': {
              map: [['@', getFilePath('components')]],
              extensions: ['.js'],
            },
          },
        },
      },
    ],
  });

describe('eslint-plugin-atomic-design', () => {
  it('プラグインの meta を公開している', () => {
    assert.deepStrictEqual(plugin.meta, {
      name: 'eslint-plugin-atomic-design',
      version,
    });
  });

  it('rules に hierarchical-import を含む', () => {
    assert.ok(plugin.rules['hierarchical-import']);
    assert.strictEqual(
      typeof plugin.rules['hierarchical-import'].create,
      'function',
    );
  });

  it('configs.recommended が flat config の形式になっている', () => {
    const config = plugin.configs.recommended;
    assert.strictEqual(config.plugins['atomic-design'], plugin);
    assert.strictEqual(
      config.rules['atomic-design/hierarchical-import'],
      'error',
    );
  });

  it('configs.recommended-legacy が eslintrc の形式になっている', () => {
    const config = plugin.configs['recommended-legacy'];
    assert.deepStrictEqual(config.plugins, ['atomic-design']);
    assert.strictEqual(
      config.rules['atomic-design/hierarchical-import'],
      'error',
    );
  });

  it('flat config 経由で上位階層の import を報告する', async () => {
    const [result] = await createESLint().lintText(
      'import Component from "@/organisms/Component";\n',
      { filePath: getFilePath('components', 'molecules', 'Component.js') },
    );

    assert.strictEqual(result.messages.length, 1);
    assert.strictEqual(
      result.messages[0].ruleId,
      'atomic-design/hierarchical-import',
    );
    assert.strictEqual(result.messages[0].messageId, 'hierarchicalImport');
  });

  it('flat config 経由で下位階層の import は報告しない', async () => {
    const [result] = await createESLint().lintText(
      'import Component from "@/atoms/Component";\n',
      { filePath: getFilePath('components', 'molecules', 'Component.js') },
    );

    assert.deepStrictEqual(result.messages, []);
  });

  // import/resolver を設定していない場合は node resolver にフォールバックする。
  // eslint-import-resolver-node を依存から落とすと "unable to load resolver" になるため、
  // 素の設定で動くことをここで担保する
  it('import/resolver の設定がなくても相対 import を解決する', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        plugin.configs.recommended,
        {
          languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
          },
        },
      ],
    });

    const [result] = await eslint.lintText(
      'import Component from "../organisms/Component";\n',
      { filePath: getFilePath('components', 'molecules', 'Component.js') },
    );

    assert.strictEqual(result.messages.length, 1);
    assert.strictEqual(result.messages[0].messageId, 'hierarchicalImport');
  });
});
