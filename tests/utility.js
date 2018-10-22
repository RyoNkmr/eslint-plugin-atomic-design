const path = require('path');

const getFilePath = (...relativePath) =>
  path.join(process.cwd(), 'tests', 'files', ...relativePath);

module.exports = { getTestPath };
