# eslint-plugin-atomic-design

atomic design rulles

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
        "atomic-design/no-higher-level-import": 2
    }
}
```

## Rules

### Hierarchical Dependencies (no-higher-level-import)

```

```




