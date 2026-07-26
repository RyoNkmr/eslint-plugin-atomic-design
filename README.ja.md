# eslint-plugin-atomic-design

[![npm version](https://badge.fury.io/js/eslint-plugin-atomic-design.svg)](https://badge.fury.io/js/eslint-plugin-atomic-design)
[![CI](https://github.com/RyoNkmr/eslint-plugin-atomic-design/actions/workflows/ci.yml/badge.svg)](https://github.com/RyoNkmr/eslint-plugin-atomic-design/actions/workflows/ci.yml)
[![downloads](https://img.shields.io/npm/dt/eslint-plugin-atomic-design.svg)](https://www.npmjs.com/package/eslint-plugin-atomic-design)

Atomic Design で構成されたプロジェクトの import が、常に下位の階層へ向かうことを保つ ESLint ルールです。

[English README](./README.md)

## 動作要件

- ESLint `>=9`（flat config に対応。ESLint 9 であれば `.eslintrc.*` も利用可能）

## インストール

```sh
npm install --save-dev eslint eslint-plugin-atomic-design
```

## 使い方

### flat config（`eslint.config.js`、ESLint 9 / 10）

```js
import atomicDesign from 'eslint-plugin-atomic-design';

export default [
  atomicDesign.configs.recommended,
  {
    files: ['src/**/*.js'],
  },
];
```

`configs.recommended` はプラグインの登録と `hierarchical-import` の有効化（error）をまとめて行います。
オプションを自分で指定する場合は、プラグインを直接登録してください。

```js
import atomicDesign from 'eslint-plugin-atomic-design';

export default [
  {
    files: ['src/**/*.js'],
    plugins: { 'atomic-design': atomicDesign },
    rules: {
      'atomic-design/hierarchical-import': [
        'error',
        {
          levels: [
            ['elements', 'atoms'],
            'molecules',
            ['=organisms', 'sections'],
          ],
          module: 'strict',
        },
      ],
    },
  },
];
```

### eslintrc（ESLint 9 のみ）

ESLint 10 で `.eslintrc.*` は廃止されましたが、ESLint 9 では従来の形式も利用できます。

```json
{
  "extends": ["plugin:atomic-design/recommended-legacy"]
}
```

または

```json
{
  "plugins": ["atomic-design"],
  "rules": {
    "atomic-design/hierarchical-import": "error"
  }
}
```

### import パスの解決について

import パスの解決には、`eslint-plugin-import` と同じ [`eslint-module-utils`](https://www.npmjs.com/package/eslint-module-utils) を使っています。
そのため `import/resolver` の設定をそのまま共有できます。
設定がない場合は Node の解決方法が使われ、相対パスと `node_modules` はそれで解決されます。

`@/` や `~/` のようなエイリアスを解決したい場合は、resolver を指定してください。

```js
export default [
  atomicDesign.configs.recommended,
  {
    settings: {
      'import/resolver': {
        // 例: eslint-import-resolver-typescript など任意の resolver
        typescript: {},
      },
    },
  },
];
```

## ルール

### `atomic-design/hierarchical-import`

同階層および上位階層のコンポーネントの import を禁止します。現在のところ、このプラグイン唯一のルールです。

#### オプション

##### `excludes: string[]`

除外パターン（正規表現文字列）。検査対象のファイルパスと、解決後の import パスのどちらかに一致した場合、検査をスキップします。

デフォルト: `['node_modules/\\w']`

##### `levels: (string | string[])[]`

プロジェクトの階層を、小さいものから大きいものへ並べます。
`=` を先頭に付けた階層は、同一階層どうしの import を許可します。
同じ順位として扱いたい階層は配列でまとめられます。

```js
{
  levels: [['elements', 'atoms'], 'molecules', ['=organisms', 'sections']],
}
```

デフォルト: `['atoms', 'molecules', '=organisms', 'templates', 'pages']`

##### `pathPatterns: string[]`

パスから階層名を取り出すための正規表現。キャプチャグループを 1 つ含めてください。

```js
{
  pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'],
}
```

省略した場合は、パスの中に最後に現れる `levels` の要素をその階層とみなします。

デフォルト: なし（デフォルトのパーサを使用）

##### `module: 'strict' | 'loose' | 'off' | false`

"module" モードでは、コンポーネントのディレクトリが「非公開の子」を持てるようになります。

`loose`（デフォルト）の場合:

```js
// './components/molecules/SuperDatepicker/SuperDatepickerCalender.js' にて

// OK
import CommonLabel from '@/components/atoms/CommonLabel.js';
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';

// NG（モジュールの子は「非公開」）
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';
```

`strict` の場合、非公開の子は同じモジュールの兄弟からも保護されます。

```js
// './components/molecules/SuperDatepicker/SuperDatepickerCalender.js' にて

// OK
import CommonLabel from '@/components/atoms/CommonLabel.js';

// NG（モジュールの子は「非公開」）
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';

// NG（子を import できるのはモジュールのルートコンポーネントだけ）
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';
// ルートである './components/molecules/SuperDatepicker/SuperDatepicker.js' でなら OK
```

module モードを無効にした場合:

```js
// './components/molecules/SuperDatepicker/SuperDatepickerCalender.js' にて

// OK
import CommonLabel from '@/components/atoms/CommonLabel.js';

// NG（molecules -> molecules）
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';
```

デフォルト: `'loose'`

## v1 からの移行

- ESLint 8 以前はサポート対象外になりました。必要な最低バージョンは ESLint 9 です。
- `configs.recommended` は flat config のオブジェクトになりました。eslintrc 形式は `configs['recommended-legacy']` に移動しています。
- 未知のルールオプションは、黙って無視されるのではなくエラーになります。
- `eslint-import-resolver-alias` はこのプラグインの依存ではなくなりました。必要な場合は個別にインストールするか、
  `eslint-import-resolver-typescript` など別の resolver を利用してください。

## ライセンス

MIT © [RyoNkmr](https://github.com/RyoNkmr)
