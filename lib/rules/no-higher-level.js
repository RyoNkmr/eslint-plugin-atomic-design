/**
 * @fileoverview disallow importing higher level components in atomic design
 * @author 
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: 'disallow importing higher level components in atomic design',
            category: 'Fill me in',
            recommended: false
        },
        fixable: null,  // or 'code' or 'whitespace'
        schema: [{
          type: 'object',
          properties: {
            levels: {
              type: 'array',
              items: ['string', {
                type: 'array',
                items: 'string',
              }],
            },
          },
        }],
    },

    create: function(context) {
        // variables should be defined here
        const levels = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
        const filename = context.getFilename();

        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------

        // any helper functions should go here or else delete this section

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        return {

            // give me methods

        };
    }
};
