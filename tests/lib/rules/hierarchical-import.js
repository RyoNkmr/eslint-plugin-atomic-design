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
      alias: {
        map: [['@', getFilePath('./components')], ['~', getFilePath('.')]],
        extensions: ['.js'],
      },
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
            ? errorMessage
                .replace(/required/g, 'imported')
                .replace(/require/g, 'import')
            : errorMessage
                .replace(/imported/g, 'required')
                .replace(/import/g, 'require'),
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
    ...spec('components/concretes/Component.js', '../molecules/Component.js', {
      options: [
        { levels: ['atoms', ['molecules', '=concretes'], 'organisms'] },
      ],
    }),

    // out of rules
    ...spec('components/molecules/Component.js', '../modals/Components.js'),
    // out of rules
    ...spec('index.js', '../atoms/Component'),

    // custom path parser
    ...spec(
      'routes/pages/Component.js',
      '../../components/organisms/Component.js',
      {
        options: [{ pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'] }],
      }
    ),

    // custom path parser + out of rules
    ...spec(
      'routes/pages/Component.js',
      '../../components/concretes/Component.js',
      {
        options: [{ pathPatterns: ['components/(\\w+)/', 'routes/(\\w+)/'] }],
      }
    ),

    // the same level
    ...spec('components/organisms/Component.js', './AnotherComponent'),

    // module-import
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      './ModuleComponentChild',
      { options: [{ module: 'loose' }] }
    ),
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      './ModuleComponentChild',
      { options: [{ module: 'strict' }] }
    ),

    // module can import non-module components
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      '@/atoms/Component.js',
      { options: [{ module: 'loose' }] }
    ),
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      '@/atoms/Component.js',
      { options: [{ module: 'strict' }] }
    ),

    // children imports are allowed in loose mode
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponentChild.js',
      './ModuleComponentOtherChild',
      { options: [{ module: 'loose' }] }
    ),

    // importing children module by other component is passed through in non-module mode
    ...spec(
      'components/organisms/Component.js',
      '@/molecules/ModuleComponent/ModuleComponentChild.js',
      { options: [{ module: 'off' }] }
    ),
  ],

  invalid: [
    // upward imports
    ...spec('components/molecules/Component.js', '../organisms/Component', {
      errors: [
        'Do not require organisms from molecules. Molecules can contain only atoms.',
      ],
    }),

    // invalid same level import
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
    ...spec('components/molecules/Component.js', '../concretes/Component.js', {
      options: [
        { levels: ['atoms', ['molecules', '=concretes'], 'organisms'] },
      ],
      errors: [
        'Do not require concretes from molecules. Molecules can contain only atoms.',
      ],
    }),

    // custom hierarchy
    ...spec('components/molecules/Component.js', '../concretes/Component.js', {
      options: [{ levels: ['atoms', ['molecules', 'concretes'], 'organisms'] }],
      errors: [
        'Do not require concretes from molecules. Molecules can contain only atoms.',
      ],
    }),

    // custom path parser
    ...spec('routes/pages/Index.js', './About.js', {
      options: [{ pathPatterns: ['routes/(\\w+)/'] }],
      errors: [
        'Do not require pages from pages. Pages can contain atoms, molecules, organisms and templates.',
      ],
    }),

    // cannot import other module in module mode
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponentChild.js',
      '../ModuleComponentOther/ModuleComponentOther.js',
      {
        options: [{ module: 'loose' }],
        errors: [
          'Do not import the other module children. ModuleComponentOther must be imported by "ModuleComponentOther" and its children, but found in ModuleComponentChild that belongs to "ModuleComponent".',
        ],
      }
    ),

    // importing children modules are blocked by the other components in 'loose' and 'strict' module mode
    ...spec(
      'components/organisms/Component.js',
      '@/molecules/ModuleComponent/ModuleComponentChild.js',
      {
        options: [{ module: 'loose' }],
        errors: [
          'Do not import a module children. ModuleComponentChild must be imported by ModuleComponent and its children',
        ],
      }
    ),

    ...spec(
      'components/organisms/Component.js',
      '@/molecules/ModuleComponent/ModuleComponentChild.js',
      {
        options: [{ module: 'strict' }],
        errors: [
          'Do not import a module children. ModuleComponentChild must be imported by ModuleComponent and its children',
        ],
      }
    ),

    // children imports are blocked in the strict module mode
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponentChild.js',
      './ModuleComponentOtherChild',
      {
        options: [{ module: 'strict' }],
        errors: [
          'In "strict" mode, Only the root module "ModuleComponent" can import its children. "ModuleComponentChild" is not root module. The module children components cannot import each other.',
        ],
      }
    ),

    // in non-module mode
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      './ModuleComponentChild',
      {
        options: [{ module: 'off' }],
        errors: [
          'Do not import molecules from molecules. Molecules can contain only atoms.',
        ],
      }
    ),
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      './ModuleComponentChild',
      {
        options: [{ module: false }],
        errors: [
          'Do not import molecules from molecules. Molecules can contain only atoms.',
        ],
      }
    ),
  ],
});
