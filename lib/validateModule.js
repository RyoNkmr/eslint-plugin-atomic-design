const path = require('path');

const isCapitalized = targetString => /^[A-Z]/.test(targetString);
const createModuleNameFilter = levelMap => moduleName =>
  isCapitalized(moduleName) &&
  !Object.prototype.hasOwnProperty.call(levelMap, moduleName)
    ? moduleName
    : undefined;

const createModuleParser = (sourcePath, levelMap) => {
  const { name: sourceName, dir: sourceDir } = path.parse(sourcePath);
  const { name: moduleName } = path.parse(sourceDir);
  const moduleNameFilter = createModuleNameFilter(levelMap);
  const sourceModule = moduleNameFilter(moduleName);

  const validator = targetPath => {
    const { name: targetName, dir } = path.parse(targetPath);
    const { name: targetModuleName } = path.parse(dir);

    return {
      module: moduleNameFilter(targetModuleName),
      name: targetName,
    };
  };

  return {
    source: {
      module: sourceModule,
      name: sourceName,
    },
    validator,
  };
};

const moduleNameValidator = ({ module, name }) =>
  module === undefined || name.startsWith(module);

const validateModule = (context, currentPath, levelMap, isStrict) => (
  resolvedPath,
  node,
  importOrRequire
) => {
  const { source, validator: moduleValidator } = createModuleParser(
    currentPath,
    levelMap,
    isStrict
  );

  if (!moduleNameValidator(source)) {
    context.report({
      node,
      message:
        'Invalid module found. {{ name }} is not a part of {{ module }}, {{ name }} should have the name starts with {{ module }}',
      data: {
        ...source,
      },
    });
    return false;
  }

  const target = moduleValidator(resolvedPath);

  if (target.module === undefined) {
    return;
  }

  if (!moduleNameValidator(target)) {
    context.report({
      node,
      message:
        'Invalid module found. {{ name }} is not a part of {{ module }}, {{ name }} should have the name starts with {{ module }}',
      data: {
        ...target,
      },
    });
    return false;
  }

  if (source.module === target.module) {
    if (isStrict && source.name !== source.module) {
      context.report({
        node,
        message:
          'In "strict" mode, Only the root module "{{ sourceModule }}" can {{ importOrRequire }} its children. "{{ sourceName }}" is not root module. The module children components cannot {{ importOrRequire }} each other.',
        data: {
          importOrRequire,
          sourceName: source.name,
          sourceModule: source.module,
        },
      });
      return false;
    }

    if (target.name.startsWith(source.module)) {
      return true;
    }

    context.report({
      node,
      message:
        'The child component name should start with {{ module }}, but {{ name }}',
      data: {
        ...target,
      },
    });
    return false;
  }

  const importedOrRequired =
    importOrRequire === 'import' ? 'imported' : 'required';

  if (target.module === target.name) {
    return;
  }

  if (source.module === undefined) {
    context.report({
      node,
      message:
        'Do not {{importOrRequire}} a module children. {{ targetName }} must be {{ importedOrRequired }} by {{ targetModule }} and its children',
      data: {
        importOrRequire,
        importedOrRequired,
        targetName: target.name,
        targetModule: target.module,
      },
    });
    return false;
  }

  if (target.name.startsWith(target.module)) {
    context.report({
      node,
      message: isStrict
        ? 'Invalid module import. {{ targetName }} must be {{ importedOrRequired }} by {{ targetModule }}'
        : 'Do not {{importOrRequire}} the other module children. {{ targetName }} must be {{ importedOrRequired }} by "{{ targetModule }}" and its children, but found in {{ sourceName }} that belongs to "{{sourceModule}}".',
      data: {
        importOrRequire,
        importedOrRequired,
        sourceName: source.name,
        sourceModule: source.module,
        targetName: target.name,
        targetModule: target.module,
      },
    });
    return false;
  }
};

module.exports = validateModule;
