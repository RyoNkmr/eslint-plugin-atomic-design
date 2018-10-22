/**
 * @fileoverview disallow importing higher level components in atomic design
 * @author RyoNkmr
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const path = require('path');
const resolve = require('eslint-module-utils/resolve').default;

const createDefaultLevelFinder = levels => pathString =>
  levels
    .reduce(
      (flatten, stringOrArray) =>
        typeof stringOrArray === 'string'
          ? [...flatten, stringOrArray]
          : [...flatten, ...stringOrArray],
      []
    )
    .reduce(
      (accumulator, _level) => {
        const lastIndex = pathString.lastIndexOf(_level);
        return lastIndex >= accumulator[1]
          ? [_level, lastIndex]
          : accumulator;
      },
      [null, 0]
    )[0];

const toRelative = (() => {
  const root = process.cwd();
  return absolutePath => path.relative(root, absolutePath);
})();

const createLevelMatcher = patterns => {
  const levelParsers = patterns.map(pattern => new RegExp(pattern, 'i'));
  return pathString => {
    const relativePath = toRelative(pathString);
    for (const levelParser of levelParsers) {
      const match = levelParser.exec(relativePath);
      if (match) {
        return match[1];
      }
    }
    return null;
  };
};

const createLevelMap = levels =>
  levels.reduce((map, level, index) => {
    return typeof level === 'string'
      ? { ...map, [level]: index }
      : level.reduce(
          (levelMap, levelItem) => ({
            ...levelMap,
            [levelItem]: index,
          }),
          map
        );
  }, {});

const filterAllowedLevels = (level, map) =>
  Object.keys(map).filter(_level => map[level] > map[_level]);

const createTips = (currentLevel, levelMap, importOrRequire) => {
  const allowedLevels = filterAllowedLevels(currentLevel, levelMap);
  const length = allowedLevels.length;
  if (length === 0) {
    return `cannot ${importOrRequire} any other components`;
  }

  return length === 1
    ? `can contain only ${allowedLevels[0]}`
    : `can contain ${allowedLevels.slice(0, -1).join(', ')} and ${
        allowedLevels[length - 1]
      }`;
};

const capitalize = string => `${string[0].toUpperCase()}${string.slice(1)}`;

const parseRequireSource = CallExpression =>
  (
    CallExpression
    && CallExpression.callee.name === 'require'
    && CallExpression.arguments.length
    && CallExpression.arguments[0].type === 'Literal'
    && CallExpression.arguments[0].value
  ) || null;

const parseImportSource = node =>
  (node && node.source && node.source.value) || null;

const DEFAULT_LEVELS = [
  'atoms',
  'molecules',
  'organisms',
  'templates',
  'pages',
];

const DEFAULT_EXCLUDES = ['/node_modules/'];

module.exports = {
  meta: {
    docs: {
      description:
        'The rule keeps downward import in atomic design',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: null, // or 'code' or 'whitespace'
    schema: [
      {
        type: 'object',
        properties: {
          excludes: {
            type: 'array',
            default: ['/node_modules/'],
            items: { type: 'string' },
            uniqueItems: true,
          },
          pathPatterns: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          levels: {
            type: 'array',
            default: [
              'atoms',
              'molecules',
              'organisms',
              'templates',
              'pages',
            ],
            uniqueItems: true,
            items: {
              anyOf: [
                { type: 'string' },
                {
                  type: 'array',
                  items: { type: 'string' },
                  uniqueItems: true,
                },
              ],
            },
          },
        },
      },
    ],
  },

  create(context) {
    const currentPath = context.getFilename();
    const options = context.options[0] || {};

    const levels = options.levels || DEFAULT_LEVELS;
    const levelMap = createLevelMap(levels);

    const excludeRegExps = (options.excludes || DEFAULT_EXCLUDES).map(
      pattern => new RegExp(pattern, 'i')
    );

    const findLevel =
      options.pathPatterns && options.pathPatterns.length > 0
        ? createLevelMatcher(options.pathPatterns)
        : createDefaultLevelFinder(levels);

    const currentLevel = findLevel(currentPath);

    const validate = (sourcePath, node, importOrRequire) => {
      const resolvedPath = resolve(sourcePath, context);
      if (!resolvedPath || excludeRegExps.some(regexp => regexp.test(resolvedPath))) {
        return;
      }

      const importLevel = findLevel(resolvedPath);
      if (importLevel === null || !Object.prototype.hasOwnProperty.call(levelMap, importLevel) || levelMap[importLevel] < levelMap[currentLevel]) {
        return;
      }

      const tips = createTips(currentLevel, levelMap, importOrRequire);

      context.report({
        node,
        message:
        'Do not {{importOrRequire}} {{importLevel}} from {{currentLevel}}. {{currentLevelCapitilized}} {{tips}}.',
        data: {
          importOrRequire,
          importLevel,
          tips,
          currentLevel,
          currentLevelCapitilized: capitalize(currentLevel),
        },
      });
    };

    return {
      CallExpression(node){
        const sourcePath = parseRequireSource(node);
        validate(sourcePath, node, 'require');
      },
      ImportDeclaration(node) {
        const sourcePath = parseImportSource(node);
        validate(sourcePath, node, 'import');
      },
    };
  },
};
