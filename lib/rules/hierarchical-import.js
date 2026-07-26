/**
 * @fileoverview Disallow importing the same and higher level components
 * @author RyoNkmr
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const resolve = require('eslint-module-utils/resolve').default;

const {
  createTips,
  createLevelMap,
  createLevelMatcher,
  createDefaultLevelFinder,
  filterAllowedLevels,
} = require('../helpers');

const {
  capitalize,
  parseImportSource,
  parseRequireSource,
} = require('../utils');

const messages = require('../messages');
const validateModule = require('../validateModule');

const DEFAULT_LEVELS = [
  'atoms',
  'molecules',
  '=organisms',
  'templates',
  'pages',
];

const DEFAULT_EXCLUDES = ['node_modules/\\w'];
const DEFAULT_MODULE = 'loose';

/** ESLint 9 未満との互換のためのフォールバック */
const getFilename = (context) =>
  'filename' in context ? context.filename : context.getFilename();

const getCwd = (context) =>
  'cwd' in context ? context.cwd : /* c8 ignore next */ process.cwd();

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'The rule keeps downward import in atomic design',
      recommended: false,
      url: 'https://github.com/RyoNkmr/eslint-plugin-atomic-design#readme',
    },
    fixable: null,
    messages,
    schema: [
      {
        type: 'object',
        properties: {
          excludes: {
            type: 'array',
            default: DEFAULT_EXCLUDES,
            items: { type: 'string' },
            uniqueItems: true,
          },
          levels: {
            type: 'array',
            default: DEFAULT_LEVELS,
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
          pathPatterns: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          module: {
            enum: ['strict', 'loose', 'off', false],
            default: DEFAULT_MODULE,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const currentPath = getFilename(context);
    const options = context.options[0] || {};

    const excludeRegExps = (options.excludes || DEFAULT_EXCLUDES).map(
      (pattern) => new RegExp(pattern, 'i'),
    );

    if (excludeRegExps.some((regexp) => regexp.test(currentPath))) {
      return {};
    }

    const levels = options.levels || DEFAULT_LEVELS;
    const levelMap = createLevelMap(levels);

    const findLevel =
      options.pathPatterns && options.pathPatterns.length > 0
        ? createLevelMatcher(options.pathPatterns, getCwd(context))
        : createDefaultLevelFinder(levelMap);

    const currentLevel = findLevel(currentPath);

    if (currentLevel === null) {
      return {};
    }

    const allowedLevels = filterAllowedLevels(currentLevel, levelMap);
    const moduleValidator = !['off', false].includes(options.module)
      ? validateModule(
          context,
          currentPath,
          levelMap,
          options.module === 'strict',
        )
      : () => {};

    const validate = (sourcePath, node, importOrRequire) => {
      if (!sourcePath) {
        return;
      }

      const resolvedPath = resolve(sourcePath, context);

      if (
        !resolvedPath ||
        excludeRegExps.some((regexp) => regexp.test(resolvedPath))
      ) {
        return;
      }

      if (
        typeof moduleValidator(resolvedPath, node, importOrRequire) ===
        'boolean'
      ) {
        return;
      }

      const importLevel = findLevel(resolvedPath);
      if (
        importLevel === null ||
        !Object.prototype.hasOwnProperty.call(levelMap, importLevel) ||
        allowedLevels.includes(importLevel)
      ) {
        return;
      }

      return context.report({
        node,
        messageId: 'hierarchicalImport',
        data: {
          importOrRequire,
          importLevel,
          tips: createTips(allowedLevels, importOrRequire),
          currentLevel,
          currentLevelCapitalized: capitalize(currentLevel),
        },
      });
    };

    return {
      CallExpression(node) {
        validate(parseRequireSource(node), node, 'require');
      },
      ImportDeclaration(node) {
        validate(parseImportSource(node), node, 'import');
      },
    };
  },
};
