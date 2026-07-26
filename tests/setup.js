'use strict';

/**
 * ESLint の RuleTester は describe / it をグローバルから探すが、
 * node:test はそれらをグローバルへ注入しないため、ここで明示的に繋ぐ。
 * このファイルは `node --test --require ./tests/setup.js` で読み込まれる。
 */

const { describe, it } = require('node:test');
const { RuleTester } = require('eslint');

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
