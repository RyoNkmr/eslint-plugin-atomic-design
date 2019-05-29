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

const moduleSpec = (filePath, targetPath, others = {}) => (modules = []) =>
  modules.reduce(
    (acc, module) => [
      ...acc,
      ...spec(filePath, targetPath, {
        ...others,
        options: [{ ...(others.options || []), module }],
      }),
    ],
    []
  );

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
    ...moduleSpec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      './ModuleComponentChild'
    )(['loose', 'strict']),

    // module can import non-module components
    ...moduleSpec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      '@/atoms/Component.js'
    )(['loose', 'strict']),

    // module root components are allowed to be imported by the other modules or components
    ...moduleSpec(
      'components/organisms/Component.js',
      '@/molecules/ModuleComponent/ModuleComponent.js',
      { options: [{ levels: ['molecules', 'organisms'] }] }
    )(['loose', 'strict']),

    // children imports are allowed in loose mode
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponentChild.js',
      './ModuleComponentOtherChild',
      { options: [{ module: 'loose' }] }
    ),

    // importing children module by other component is passed through in non-module mode
    ...moduleSpec(
      'components/organisms/Component.js',
      '@/molecules/ModuleComponent/ModuleComponentChild.js'
    )(['off', false]),
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

    // module cannot import higher level non-module components
    ...moduleSpec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      '@/organisms/Component.js',
      {
        errors: [
          'Do not import organisms from molecules. Molecules can contain only atoms.',
        ],
      }
    )(['loose', 'strict', 'off', false]),

    // invalid level imports in module mode
    ...spec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      '@/organisms/BigModuleComponent/BigModuleComponent.js',
      {
        options: [{ module: 'loose' }],
        errors: [
          'Do not import organisms from molecules. Molecules can contain only atoms.',
        ],
      }
    ),

    // cannot import the other module's children
    ...spec(
      'components/organisms/BigModuleComponent/BigModuleComponent.js',
      '@/molecules/ModuleComponent/ModuleComponentChild.js',
      {
        options: [{ module: 'loose' }],
        errors: [
          'Do not import the other module children. ModuleComponentChild must be imported by "ModuleComponent" and its children, but found in BigModuleComponent that belongs to "BigModuleComponent".',
        ],
      }
    ),

    // importing children modules are blocked by the other components in 'loose' and 'strict' module mode
    ...moduleSpec(
      'components/organisms/Component.js',
      '@/molecules/ModuleComponent/ModuleComponentChild.js',
      {
        errors: [
          'Do not import a module children. ModuleComponentChild must be imported by ModuleComponent and its children',
        ],
      }
    )(['loose', 'strict']),

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

    // invalid source module name
    ...moduleSpec(
      'components/molecules/ModuleComponent/InvalidComponent.js',
      './ModuleComponentChild',
      {
        errors: [
          'Invalid module found. InvalidComponent is not a part of ModuleComponent, InvalidComponent should have the name starts with ModuleComponent',
        ],
      }
    )(['loose', 'strict']),

    // invalid target module name
    ...moduleSpec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      '../ModuleComponentOther/InvalidComponent.js',
      {
        errors: [
          'Invalid module found. InvalidComponent is not a part of ModuleComponentOther, InvalidComponent should have the name starts with ModuleComponentOther',
        ],
      }
    )(['loose', 'strict']),

    // in non-module mode
    ...moduleSpec(
      'components/molecules/ModuleComponent/ModuleComponent.js',
      './ModuleComponentChild',
      {
        errors: [
          'Do not import molecules from molecules. Molecules can contain only atoms.',
        ],
      }
    )(['off', false]),
  ],
});
