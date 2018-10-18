/**
 * @fileoverview disallow importing higher level components in atomic design
 * @author 
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/no-higher-level"),

    RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run("no-higher-level", rule, {

    valid: [

        // give me some code that won't trigger a warning
    ],

    invalid: [
        {
            code: "import HigherLevelComponent from './HigherLevelComponent.vue';",
            errors: [{
                message: "Fill me in.",
                type: "Me too"
            }]
        }
    ]
});
