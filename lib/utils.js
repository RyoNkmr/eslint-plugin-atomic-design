const capitalize = string => `${string[0].toUpperCase()}${string.slice(1)}`;

const parseRequireSource = CallExpression =>
  (
    CallExpression
    && CallExpression.callee.name === 'require'
    && CallExpression.arguments.length
    && CallExpression.arguments[0].type === 'Literal'
    && CallExpression.arguments[0].value
  ) || null;

const parseImportSource = node =>
  (node && node.source && node.source.value) || null;

module.exports = {
  capitalize,
  parseImportSource,
  parseRequireSource,
};
