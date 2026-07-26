'use strict';

/**
 * テストと examples の dogfooding で使うローカル import resolver。
 *
 * eslint-import-resolver-alias は eslint-plugin-import を peer に要求するが、
 * eslint-plugin-import は ESLint 10 に未対応のため依存として持てない。
 * ここでは必要最小限（エイリアス展開 + 相対パス / bare specifier の解決）だけを実装する。
 *
 * @see https://github.com/import-js/eslint-plugin-import/blob/main/resolvers/README.md
 */

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const DEFAULT_EXTENSIONS = ['.js', '.mjs', '.cjs', '.json'];

const isFile = (targetPath) => {
  try {
    return fs.statSync(targetPath).isFile();
  } catch {
    return false;
  }
};

/** 拡張子の省略と index ファイルを補完して実在するファイルを探す */
const resolveWithExtensions = (candidate, extensions) => {
  if (isFile(candidate)) {
    return candidate;
  }

  for (const extension of extensions) {
    const withExtension = `${candidate}${extension}`;
    if (isFile(withExtension)) {
      return withExtension;
    }

    const indexFile = path.join(candidate, `index${extension}`);
    if (isFile(indexFile)) {
      return indexFile;
    }
  }

  return null;
};

const toResult = (resolvedPath) =>
  resolvedPath ? { found: true, path: resolvedPath } : { found: false };

exports.interfaceVersion = 2;

/**
 * @param {string} source import 元に書かれた文字列
 * @param {string} file import している側のファイルの絶対パス
 * @param {{ map?: [string, string][], extensions?: string[] }} [config]
 */
exports.resolve = (source, file, config) => {
  const { map = [], extensions = DEFAULT_EXTENSIONS } = config || {};

  const alias = map.find(
    ([prefix]) => source === prefix || source.startsWith(`${prefix}/`),
  );

  if (alias) {
    const [prefix, target] = alias;
    return toResult(
      resolveWithExtensions(
        path.join(target, source.slice(prefix.length)),
        extensions,
      ),
    );
  }

  if (source.startsWith('.')) {
    return toResult(
      resolveWithExtensions(
        path.resolve(path.dirname(file), source),
        extensions,
      ),
    );
  }

  // bare specifier は Node の解決に委ねる
  try {
    return toResult(createRequire(path.resolve(file)).resolve(source));
  } catch {
    return { found: false };
  }
};
