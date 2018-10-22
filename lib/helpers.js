const toRelative = (() => {
  const root = process.cwd();
  return absolutePath => require('path').relative(root, absolutePath);
})();

const createDefaultLevelFinder = levels => pathString =>
  levels
    .reduce(
      (flatten, stringOrArray) =>
        typeof stringOrArray === 'string'
          ? [...flatten, stringOrArray]
          : [...flatten, ...stringOrArray],
      []
    )
    .reduce(
      (accumulator, _level) => {
        const lastIndex = pathString.lastIndexOf(_level);
        return lastIndex >= accumulator[1]
          ? [_level, lastIndex]
          : accumulator;
      },
      [null, 0]
    )[0];

const createLevelMatcher = patterns => {
  const levelParsers = patterns.map(pattern => new RegExp(pattern, 'i'));
  return pathString => {
    const relativePath = toRelative(pathString);
    for (const levelParser of levelParsers) {
      const match = levelParser.exec(relativePath);
      if (match) {
        return match[1];
      }
    }
    return null;
  };
};

const createLevelMap = levels =>
  levels.reduce((map, level, index) => {
    return typeof level === 'string'
      ? { ...map, [level]: index }
      : level.reduce(
          (levelMap, levelItem) => ({
            ...levelMap,
            [levelItem]: index,
          }),
          map
        );
  }, {});

const filterAllowedLevels = (level, map) =>
  Object.keys(map).filter(_level => map[level] > map[_level]);

const createTips = (currentLevel, levelMap, importOrRequire) => {
  const allowedLevels = filterAllowedLevels(currentLevel, levelMap);
  const length = allowedLevels.length;
  if (length === 0) {
    return `cannot ${importOrRequire} any other components`;
  }

  return length === 1
    ? `can contain only ${allowedLevels[0]}`
    : `can contain ${allowedLevels.slice(0, -1).join(', ')} and ${
        allowedLevels[length - 1]
      }`;
};

module.exports = {
  createTips,
  createLevelMap,
  createLevelMatcher,
  createDefaultLevelFinder,
};
