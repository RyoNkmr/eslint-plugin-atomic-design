/**
 * @fileoverview disallow importing higher level components in atomic design
 * @author RyoNkmr
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const getFilePath = (...relativePath) =>
  require('path').join(process.cwd(), 'tests', 'files', ...relativePath);

const rule = require('../../../lib/rules/hierarchical-import');
const RuleTester = require('eslint').RuleTester;

const testerSettings = {
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      alias: [['@', getFilePath('./components')], ['~', getFilePath('.')]],
    },
  },
};

const spec = (filePath, targetPath, others = {}) =>
  [
    `const Component = require("${targetPath}")`,
    `import Component from "${targetPath}"`,
  ].map(code => {
    const errorMessage = others.errors && others.errors[0];
    if (errorMessage) {
      return {
        code,
        filename: getFilePath(filePath),
        ...others,
        errors: [
          code.startsWith('import')
            ? errorMessage.replace(/require/g, 'import')
            : errorMessage.replace(/import/g, 'require'),
        ],
      };
    }

    return {
      code,
      filename: getFilePath(filePath),
      ...others,
    };
  });

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester(testerSettings);

ruleTester.run('hierarchical-import', rule, {
  valid: [
    // relative path resolution and extension omittion
    ...spec('components/molecules/Component.js', '../atoms/Component.js'),
    ...spec('components/molecules/Component.js', '../atoms/Component'),

    // aliases
    ...spec('components/molecules/Component.js', '~/atoms/Component'),
    ...spec(
      'components/molecules/Component.js',
      '@/components/atoms/Component'
    ),

    // node_modules resolution
    ...spec(
      'components/organisms/Component.js',
      'component_library/molecules/Component'
    ),
    // they're ignored by this rule as deafult
    ...spec(
      'components/molecules/Component.js',
      'component_library/molecules/Component'
    ),

    // custom hierarchy
    ...spec('components/organisms/Component.js', '../concretes/Component.js', {
      options: [{ levels: ['atoms', ['molecules', 'concretes'], 'organisms'] }],
    }),

    // out of rules
    ...spec('components/molecules/Component.js', '../modals/Components.js'),

    // custom path parser
    ...spec(
      'routes/pages/Component.js',
      '../../components/organisms/Component.js',
      {
        options: [{ pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'] }],
      }
    ),
    // passing through
    ...spec(
      'routes/pages/Component.js',
      '../../components/concretes/Component.js',
      {
        options: [{ pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'] }],
        errors: [
          'Do not require molecules from molecules. Molecules can contain only atoms.',
        ],
      }
    ),
  ],

  invalid: [
    // upward imports
    ...spec('components/molecules/Component.js', '../organisms/Component', {
      errors: [
        'Do not require organisms from molecules. Molecules can contain only atoms.',
      ],
    }),

    // same level import
    ...spec('components/atoms/Component.js', './Other', {
      errors: [
        'Do not require atoms from atoms. Atoms cannot require any other components.',
      ],
    }),
    ...spec('components/molecules/Component.js', './Other', {
      errors: [
        'Do not require molecules from molecules. Molecules can contain only atoms.',
      ],
    }),

    // custom hierarchy
    ...spec('components/molecules/Component.js', '../concretes/Component.js', {
      options: [{ levels: ['atoms', ['molecules', 'concretes'], 'organisms'] }],
      errors: [
        'Do not require concretes from molecules. Molecules can contain only atoms.',
      ],
    }),

    // node_modules resolution and
    ...spec(
      'components/molecules/Component.js',
      'component_library/molecules/Component',
      {
        options: [{ excludes: [] }],
        errors: [
          'Do not require molecules from molecules. Molecules can contain only atoms.',
        ],
      }
    ),

    // custom path parser
    ...spec('routes/pages/Index.js', './About.js', {
      options: [{ pathPatterns: ['routes/(\\w+)/'] }],
      errors: [
        'Do not require pages from pages. Pages can contain atoms, molecules, organisms and templates.',
      ],
    }),
  ],
});
