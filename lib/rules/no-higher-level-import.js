/**
 * @fileoverview disallow importing higher level components in atomic design
 * @author RyoNkmr
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const path = require('path');

const generatelevelMatchString = levels =>
  `(${
    levels.reduce((accumulator, level) =>
      (typeof level === 'string')
        ? `${accumulator}|${level}`
        : `${accumulator}|${level.join('|')}`
        , '').slice(1)
  })`;

const toRelative = (() => {
  const root = process.cwd();
  return absolutePath => path.relative(root, absolutePath)
})();

const findLevel = (path, levelParsers) => {
  const pathString = toRelative(path).toLowerCase();
  for(const levelParser of levelParsers) {
    const match = levelParser.exec(path);
    if (match) {
      return match[1];
    }
  }
  return null;
}

const createLevelMap = levels =>
  levels.reduce((map, level, index) => {
    return (typeof level === 'string')
      ? { ...map, [level]: index }
      : level.reduce((levelMap, levelItem) => ({
        ...levelMap,
        [levelItem]: index,
      }), map);
  }, {})

const parseImportSource = node => (node && node.source && node.source.value) || null;
const filterAllowedLevels = (level, map) => Object.keys(map).filter(_level => map[level] > map[_level]);

const createTips = allowedLevels => {
  const length = allowedLevels.length;
  if (length === 0) {
    return 'can not import any other level components';
  }

  return length === 1
    ? `can contain only ${allowedLevels[0]}`
    : `can contain ${allowedLevels.slice(0, -1)} and ${allowedLevels[length - 1]}`;
}

const DEFAULT_LEVELS = ['atoms', 'molecules', 'organisms', 'templates', ['pages', 'modals']];
const DEFAULT_EXCLUDES = ['\/node_modules\/'];

module.exports = {
  meta: {
    docs: {
      description: 'Disallow importing higher level components in atomic design',
      category: 'Atomic Design',
      recommended: false
    },
    fixable: null,  // or 'code' or 'whitespace'
    schema: [{
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
              'string', {
                type: 'array',
                items: { type: 'string' },
              },
            ],
          },
        },
      },
    }],
    schema: [],
  },

  create: function(context) {
    const options = context.options[0] || {};
    const levels = options.levels || DEFAULT_LEVELS;
    const excludes = options.excludes || DEFAULT_LEVELS;
    const pathPatterns = options.pathPatterns || [generatelevelMatchString(levels)];

    const levelMap = createLevelMap(levels);
    const currentPath = context.getFilename();

    const pathParsers = pathPatterns.map(pattern => new RegExp(pattern));
    const currentLevel = findLevel(currentPath, pathParsers);

    // const excludeRegexes = 

    return {
      ImportDeclaration(node) {
        const sourcePath = parseImportSource(node);
        if (!sourcePath) {
          return;
        }

        const importLevel = findLevel(sourcePath, pathParsers);
        if (importLevel === null) {
          return;
        }

        if (levelMap[importLevel] >= levelMap[currentLevel]) {
          const allowedLevels = filterAllowedLevels(currentLevel, levelMap);
          const tips = createTips(allowedLevels);

          context.report({
            node,
            message: 'Importing {{ importLevel }} was found. {{ currentLevel }} {{ tips }}.',
            data: {
              importLevel,
              currentLevel,
              tips,
            },
          });
        }
      },
    };
  },
};
