/**
 * @fileoverview atomic design rulles
 * @author ryonkmr
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var requireIndex = require("requireindex");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


// import all rules in lib/rules
module.exports.rules = requireIndex(__dirname + "/rules");

module.exports.configs = {
  recommended: {
    rules: {
      'atomic-design/hierarchical-import': 2,
    },
  },
};
