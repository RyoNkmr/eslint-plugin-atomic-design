# eslint-plugin-atomic-design

[![npm version](https://badge.fury.io/js/eslint-plugin-atomic-design.svg)](https://badge.fury.io/js/eslint-plugin-atomic-design)
[![CI](https://github.com/RyoNkmr/eslint-plugin-atomic-design/actions/workflows/ci.yml/badge.svg)](https://github.com/RyoNkmr/eslint-plugin-atomic-design/actions/workflows/ci.yml)
[![downloads](https://img.shields.io/npm/dt/eslint-plugin-atomic-design.svg)](https://www.npmjs.com/package/eslint-plugin-atomic-design)

ESLint rules that keep imports flowing downward through the layers of an Atomic Design project.

[日本語版 README](./README.ja.md)

## Requirements

- ESLint `>=9` (both flat config and, on ESLint 9, `.eslintrc.*` are supported)

## Installation

```sh
npm install --save-dev eslint eslint-plugin-atomic-design
```

## Usage

### Flat config (`eslint.config.js`, ESLint 9 / 10)

```js
import atomicDesign from 'eslint-plugin-atomic-design';

export default [
  atomicDesign.configs.recommended,
  {
    files: ['src/**/*.js'],
  },
];
```

`configs.recommended` registers the plugin and turns `hierarchical-import` on as an error.
To configure the rule yourself, register the plugin directly:

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

### eslintrc (ESLint 9 only)

ESLint 10 removed `.eslintrc.*` support, but on ESLint 9 the legacy shape is still available:

```json
{
  "extends": ["plugin:atomic-design/recommended-legacy"]
}
```

or

```json
{
  "plugins": ["atomic-design"],
  "rules": {
    "atomic-design/hierarchical-import": "error"
  }
}
```

### Resolving import paths

Import paths are resolved through [`eslint-module-utils`](https://www.npmjs.com/package/eslint-module-utils), the same
machinery `eslint-plugin-import` uses, so the `import/resolver` setting is shared with it.
Without any setting, Node's own resolution is used, which covers relative paths and `node_modules`.

To resolve aliases such as `@/` or `~/`, point the setting at a resolver:

```js
export default [
  atomicDesign.configs.recommended,
  {
    settings: {
      'import/resolver': {
        // e.g. eslint-import-resolver-typescript, or any resolver package
        typescript: {},
      },
    },
  },
];
```

## Rules

### `atomic-design/hierarchical-import`

Disallows importing components that sit on the same or a higher level of the hierarchy.
Currently this is the only rule of this plugin.

#### Options

##### `excludes: string[]`

Regular expression patterns. A file is skipped when either the linted file path or the resolved import path matches.

default: `['node_modules/\\w']`

##### `levels: (string | string[])[]`

Component levels in your project, listed from the smallest to the largest.
A level prefixed with `=` may import other components on the same level.
Levels that share a single rank can be written as an array:

```js
{
  levels: [['elements', 'atoms'], 'molecules', ['=organisms', 'sections']],
}
```

default: `['atoms', 'molecules', '=organisms', 'templates', 'pages']`

##### `pathPatterns: string[]`

Regular expressions containing one capturing group, used to read the level out of a path:

```js
{
  pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'],
}
```

When omitted, the level is taken from the last `levels` entry that appears in the path.

default: none (use the default parser)

##### `module: 'strict' | 'loose' | 'off' | false`

"module" mode lets a component directory own private children.

In `loose` mode (the default):

```js
// in './components/molecules/SuperDatepicker/SuperDatepickerCalender.js'

// valid
import CommonLabel from '@/components/atoms/CommonLabel.js';
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';

// invalid (module children are "private")
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';
```

In `strict` mode, private children are protected even from their own siblings:

```js
// in './components/molecules/SuperDatepicker/SuperDatepickerCalender.js'

// valid
import CommonLabel from '@/components/atoms/CommonLabel.js';

// invalid (module children are "private")
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';

// invalid (only the module root component may import its children)
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';
// ...which is valid in the root component './components/molecules/SuperDatepicker/SuperDatepicker.js'
```

With module mode turned off:

```js
// in './components/molecules/SuperDatepicker/SuperDatepickerCalender.js'

// valid
import CommonLabel from '@/components/atoms/CommonLabel.js';

// invalid (molecules -> molecules)
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';
```

default: `'loose'`

## Migrating from v1

- ESLint 8 and older are no longer supported. The minimum is ESLint 9.
- `configs.recommended` is now a flat config object. The eslintrc shape moved to `configs['recommended-legacy']`.
- Unknown rule options are now rejected instead of being silently ignored.
- `eslint-import-resolver-alias` is no longer a dependency of this plugin. If you rely on it, install it yourself,
  or use another resolver such as `eslint-import-resolver-typescript`.

## License

MIT © [RyoNkmr](https://github.com/RyoNkmr)
