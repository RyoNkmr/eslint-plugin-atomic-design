# eslint-plugin-atomic-design

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
    "plugins": [
        "atomic-design"
    ]
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
This is the only rule of this plugin.

#### options
##### excludes `Array<RegExpString>`
Matching patterns ignore both target file paths and importing paths.

default: `['node_modules\/\\w']`

##### levels `Array<String|String[]>`
Components levels in your projects listing up in order of size.
Additionally this can be defined *the same level components* as Array of strings:

```javascript
{
  levels: [['element', 'atom'], 'molecules', ['organisms', 'sections']],
},
```

default: `['atoms', 'molecules', 'organisms', 'templates', 'pages']`

##### pathPatterns `Array<RegExpString>`
Patterns should contain an capturing group `(\\w+)`:

```javascript
{
  pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'],
},
```

or `<DefaultParser>` takes the last match of the one of `levels` in import paths.

default: `<DefaultParser>`

© [RyoNkmr](https://github.com/RyoNkmr)
