/**
 * @fileoverview atomic design rulles
 * @author ryonkmr
 */
"use strict";

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


// import all rules in lib/rules
const rules = [
  'hierarchical-import',
];

module.exports.rules = rules.reduce((imported, rule) => ({
  ...imported,
  [rule]: require(`./rules/${rule}`),
}), {});

module.exports.configs = {
  recommended: {
    rules: {
      'atomic-design/hierarchical-import': 2,
    },
  },
};
