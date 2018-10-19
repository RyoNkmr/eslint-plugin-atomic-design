/**
 * @fileoverview disallow importing higher level components in atomic design
 * @author RyoNkmr
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const path = require('path');

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
  const levelParsers = patterns.map(pattern => new Regexp(pattern, 'i'));
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

const parseImportSource = node =>
  (node && node.source && node.source.value) || null;

const filterAllowedLevels = (level, map) =>
  Object.keys(map).filter(_level => map[level] > map[_level]);

const createTips = allowedLevels => {
  const length = allowedLevels.length;
  if (length === 0) {
    return 'can not import any other level components';
  }

  return length === 1
    ? `can contain only ${allowedLevels[0]}`
    : `can contain ${allowedLevels.slice(0, -1)} and ${
        allowedLevels[length - 1]
      }`;
};

const capitalize = string => `${string[0].toUpperCase()}${string.slice(1)}`;

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
        'Disallow importing higher level components in atomic design',
      category: 'Atomic Design',
      recommended: false,
    },
    fixable: null, // or 'code' or 'whitespace'
    schema: [
      {
        type: 'object',
        properties: {
          excludes: {
            type: 'array',
            items: { type: 'string' },
          },
          pathPatterns: {
            type: 'array',
            items: { type: 'string' },
          },
          levels: {
            type: 'array',
            items: {
              type: [
                'string',
                {
                  type: 'array',
                  items: { type: 'string' },
                },
              ],
            },
          },
        },
      },
    ],
    schema: [],
  },

  create: function(context) {
    const currentPath = context.getFilename();
    const options = context.options[0] || {};

    const levels = options.levels || DEFAULT_LEVELS;
    const levelMap = createLevelMap(levels);

    const excludes = (options.excludes || DEFAULT_EXCLUDES).map(
      pattern => new RegExp(pattern, 'i')
    );

    const findLevel =
      options.pathPatterns && options.pathPatterns.length > 0
        ? createLevelMatcher(options.pathPatterns)
        : createDefaultLevelFinder(levels);

    const fileLevel = findLevel(currentPath);

    return {
      ImportDeclaration(node) {
        const sourcePath = parseImportSource(node);
        if (!sourcePath) {
          return;
        }

        const importLevel = findLevel(sourcePath);
        if (importLevel === null || levelMap[importLevel] < levelMap[fileLevel]) {
          return;
        }

        const allowedLevels = filterAllowedLevels(fileLevel, levelMap);
        const tips = createTips(allowedLevels);

        context.report({
          node,
          message:
          'Do not import {{ importLevel }}. {{ fileLevel }} {{ tips }}.',
          data: {
            importLevel,
            fileLevel: capitalize(fileLevel),
            tips,
          },
        });
      },
    };
  },
};
