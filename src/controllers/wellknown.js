'use strict';

const debug = require('debug')('lti-advantage-tool:controllers')

const jose = require('../jose');

module.exports.jwks = async (req,res) => {
    debug('jwks');
    
    const jwks = jose.get_public_keys();
    
    res.send(jwks);
};
