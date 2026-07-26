'use strict';

/**
 * ルールが報告するメッセージ定義。
 * meta.messages に展開し、report 側は messageId で参照する。
 */
module.exports = {
  hierarchicalImport:
    'Do not {{ importOrRequire }} {{ importLevel }} from {{ currentLevel }}. {{ currentLevelCapitalized }} {{ tips }}.',
  invalidModuleName:
    'Invalid module found. {{ name }} is not a part of {{ module }}, {{ name }} should have the name starts with {{ module }}',
  strictModuleChildrenImport:
    'In "strict" mode, Only the root module "{{ sourceModule }}" can {{ importOrRequire }} its children. "{{ sourceName }}" is not root module. The module children components cannot {{ importOrRequire }} each other.',
  invalidChildName:
    'The child component name should start with {{ module }}, but {{ name }}',
  moduleChildrenImport:
    'Do not {{ importOrRequire }} a module children. {{ targetName }} must be {{ importedOrRequired }} by {{ targetModule }} and its children',
  otherModuleChildrenImportStrict:
    'Invalid module import. {{ targetName }} must be {{ importedOrRequired }} by {{ targetModule }}',
  otherModuleChildrenImport:
    'Do not {{ importOrRequire }} the other module children. {{ targetName }} must be {{ importedOrRequired }} by "{{ targetModule }}" and its children, but found in {{ sourceName }} that belongs to "{{ sourceModule }}".',
};
