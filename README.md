# eslint-plugin-atomic-design

[![npm version](https://badge.fury.io/js/eslint-plugin-atomic-design.svg)](https://badge.fury.io/js/eslint-plugin-atomic-design)
[![CircleCI](https://circleci.com/gh/RyoNkmr/eslint-plugin-atomic-design.svg?style=shield)](https://circleci.com/gh/RyoNkmr/eslint-plugin-atomic-design)
[![downloads](https://img.shields.io/npm/dt/eslint-plugin-atomic-design.svg)](https://www.npmjs.com/package/eslint-plugin-atomic-design)
[![Coverage Status](https://coveralls.io/repos/github/RyoNkmr/eslint-plugin-atomic-design/badge.svg?branch=master)](https://coveralls.io/github/RyoNkmr/eslint-plugin-atomic-design?branch=master)
![david-dm](https://david-dm.org/RyoNkmr/eslint-plugin-atomic-design.svg)

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-atomic-design`:

```
$ npm install eslint-plugin-atomic-design --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-atomic-design` globally.

## Usage

Add `atomic-design` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["atomic-design"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "atomic-design/hierarchical-import": 2
  }
}
```

## Rules

### Hierarchical Dependencies (hierarchical-import)

Currently, this is the only rule of this plugin.

#### options

##### excludes `Array<RegExpString>`

Matching patterns ignore both target file paths and importing paths.

default: `['node_modules\/\\w']`

##### levels `Array<String|String[]>`

Components levels in your projects listing up in order of size and starting with '=' are capable of _the same level importing._  
Additionally, this can be defined _the same level components_ as an Array of strings:

```javascript
{
  levels: [['elements', 'atoms'], 'molecules', ['=organisms', 'sections']],
},
```

default: `['atoms', 'molecules', '=organisms', 'templates', 'pages']`

##### pathPatterns `Array<RegExpString>`

Patterns should contain a capturing group like `(\\w+)`:

```javascript
{
  pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'],
},
```

or `<DefaultParser>` takes the last match of one of the `levels` in import paths.

default: `<DefaultParser>`

##### module `'strict' | 'loose' | 'off' | false`

"module" mode allows to have children as module's "private" components.

in 'loose' mode (default setting):

```javascript
// in './components/molecules/SuperDatepicker/SuperDatepickerCalender.js'

// valid
import CommonLabel from '@/components/atom/CommonLabel.js';
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';

// invalid (Module children are "private")
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';
```

in 'strict' mode, "private" children are protected even if importing comes from the same module siblings:

```javascript
// in './components/molecules/SuperDatepicker/SuperDatepickerCalender.js'

// valid
import CommonLabel from '@/components/atom/CommonLabel.js';

// invalid (Module children are "private")
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';

// invalid (Only the module root component can import its children)
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';
// valid in the "root" component './components/molecules/SuperDatepicker/SuperDatepicker.js'
```

in non-module mode:

```javascript
// in './components/molecules/SuperDatepicker/SuperDatepickerCalender.js'

// valid
import CommonLabel from '@/components/atom/CommonLabel.js';

// invalid (molecules -> molecules)
import OtherModuleChildren from '@/components/molecules/OtherModule/OtherModuleChildren.js';
import SuperDatepickerCalenderInput from '@/components/molecules/SuperDatepicker/SuperDatepickerCalenderInput.js';
```

default: `loose`

© [RyoNkmr](https://github.com/RyoNkmr)
