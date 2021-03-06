const path = require('path');

const OPTION_IDENTIFIERS = {
  allowSameLevels: '=',
};

const levelStringRegex = new RegExp(
  `([${Object.keys(OPTION_IDENTIFIERS)
    .map((key) => OPTION_IDENTIFIERS[key])
    .join('')}]*)(.+)`
);

const parseLevelOptionFromString = (levelString) => {
  const [, optionsString, level] = levelStringRegex.exec(levelString);
  const options = Object.keys(OPTION_IDENTIFIERS).reduce(
    (options, option) => ({
      ...options,
      [option]: optionsString.includes(OPTION_IDENTIFIERS[option]),
    }),
    {}
  );
  return {
    level,
    options,
  };
};

const toRelative = (() => {
  const root = process.cwd();
  return (absolutePath) => path.relative(root, absolutePath);
})();

const createDefaultLevelFinder = (levelMap) => (pathString) =>
  Object.keys(levelMap).reduce(
    (accumulator, _level) => {
      const lastIndex = pathString.lastIndexOf(_level);
      return lastIndex >= accumulator[1] ? [_level, lastIndex] : accumulator;
    },
    [null, 0]
  )[0];

const createLevelMatcher = (patterns) => {
  const levelParsers = patterns.map((pattern) => new RegExp(pattern, 'i'));
  return (pathString) => {
    const relativePath = toRelative(pathString);
    const matchedParser = levelParsers.find((parser) =>
      parser.test(relativePath)
    );
    if (matchedParser === undefined) {
      return null;
    }
    const [, matched] = matchedParser.exec(relativePath);
    return matched;
  };
};

const createLevelMap = (() => {
  const mergeMap = (map, levelString, priority) => {
    const { level, options } = parseLevelOptionFromString(levelString);
    return { ...map, [level]: { priority, ...options } };
  };

  return (levels) =>
    levels.reduce((map, level, priority) => {
      if (typeof level === 'string') {
        return mergeMap(map, level, priority);
      }
      if (Array.isArray(level)) {
        return level.reduce(
          (levelMap, levelItem) => mergeMap(levelMap, levelItem, priority),
          map
        );
      }
      return map;
    }, {});
})();

const filterAllowedLevels = (baseLevel, levelMap) => {
  const base = levelMap[baseLevel];
  const criterion = Number(!base.allowSameLevels);
  return Object.keys(levelMap).filter(
    (level) => base.priority - levelMap[level].priority >= criterion
  );
};

const createTips = (allowedLevels, importOrRequire) => {
  const { length } = allowedLevels;
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
  toRelative,
  createTips,
  createLevelMap,
  createLevelMatcher,
  createDefaultLevelFinder,
  filterAllowedLevels,
};
