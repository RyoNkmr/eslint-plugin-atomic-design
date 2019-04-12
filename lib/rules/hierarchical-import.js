/**
 * @fileoverview Disallow importing the same and higher level components
 * @author RyoNkmr
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const {
  createTips,
  createLevelMap,
  createLevelMatcher,
  createDefaultLevelFinder,
  toRelative,
  filterAllowedLevels,
  createSameModuleValidator,
} = require('../helpers');

const {
  capitalize,
  parseImportSource,
  parseRequireSource,
} = require('../utils');

const DEFAULT_LEVELS = [
  'atoms',
  'molecules',
  '=organisms',
  'templates',
  'pages',
];

const DEFAULT_EXCLUDES = ['node_modules/\\w'];
const DEFAULT_MODULE = 'loose';

module.exports = {
  meta: {
    docs: {
      description: 'The rule keeps downward import in atomic design',
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
      },
    ],
  },

  create(context) {
    const currentPath = context.getFilename();
    const options = context.options[0] || {};

    const excludeRegExps = (options.excludes || DEFAULT_EXCLUDES).map(
      pattern => new RegExp(pattern, 'i')
    );

    if (excludeRegExps.some(regexp => regexp.test(currentPath))) {
      return {};
    }

    const levels = options.levels || DEFAULT_LEVELS;
    const levelMap = createLevelMap(levels);

    const findLevel =
      options.pathPatterns && options.pathPatterns.length > 0
        ? createLevelMatcher(options.pathPatterns)
        : createDefaultLevelFinder(levelMap);

    const currentLevel = findLevel(currentPath);

    if (currentLevel === null) {
      return {};
    }
    const allowedLevels = filterAllowedLevels(currentLevel, levelMap);

    const { isModule, validator: moduleValidator } = !['off', false].includes(
      options.module
    )
      ? createSameModuleValidator(
          currentPath,
          levelMap,
          options.module === 'strict'
        )
      : { isModule: false, validator: () => ({}) };

    const validate = (sourcePath, node, importOrRequire) => {
      if (!sourcePath) {
        return;
      }
      const resolvedPath = require('eslint-module-utils/resolve').default(
        sourcePath,
        context
      );
      if (
        !resolvedPath ||
        excludeRegExps.some(regexp => regexp.test(resolvedPath))
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

      if (isModule) {
        const {
          sourceName,
          moduleName,
          isStrict,
          isRoot,
          isSameModule,
          isValidImport,
        } = moduleValidator(resolvedPath);
        if (isSameModule) {
          if (isValidImport && (!isStrict || isRoot)) {
            return;
          }
          return context.report({
            node,
            message: !isValidImport
              ? 'The child component name should start with {{moduleName}}.'
              : 'In "strict" mode, Only the root module "{{moduleName}}" can use its children. "{{sourceName}}" is not root module. The children components cannot use each other.',
            data: {
              sourceName,
              moduleName,
            },
          });
        }
      }

      const tips = createTips(allowedLevels, importOrRequire);

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
      CallExpression(node) {
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
