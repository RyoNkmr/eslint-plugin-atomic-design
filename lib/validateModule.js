const path = require('path');

const isCapitalized = (targetString) => /^[A-Z]/.test(targetString);
const createModuleNameFilter = (levelMap) => (moduleName) =>
  isCapitalized(moduleName) &&
  !Object.prototype.hasOwnProperty.call(levelMap, moduleName)
    ? moduleName
    : undefined;

const createModuleParser = (sourcePath, levelMap) => {
  const { name: sourceName, dir: sourceDir } = path.parse(sourcePath);
  const { name: moduleName } = path.parse(sourceDir);
  const moduleNameFilter = createModuleNameFilter(levelMap);
  const sourceModule = moduleNameFilter(moduleName);

  const validator = (targetPath) => {
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

const validateModule =
  (context, currentPath, levelMap, isStrict) =>
  (resolvedPath, node, importOrRequire) => {
    const { source, validator: moduleValidator } = createModuleParser(
      currentPath,
      levelMap,
      isStrict,
    );

    if (!moduleNameValidator(source)) {
      context.report({
        node,
        messageId: 'invalidModuleName',
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
        messageId: 'invalidModuleName',
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
          messageId: 'strictModuleChildrenImport',
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
        messageId: 'invalidChildName',
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
        messageId: 'moduleChildrenImport',
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
        messageId: isStrict
          ? 'otherModuleChildrenImportStrict'
          : 'otherModuleChildrenImport',
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
