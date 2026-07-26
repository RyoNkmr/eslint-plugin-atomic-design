'use strict';

/**
 * semantic-release がリリース種別を判定するため、
 * Conventional Commits に従っているかを commit-msg フックで検証する。
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
