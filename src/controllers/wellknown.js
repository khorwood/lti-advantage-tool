'use strict';

const debug = require('debug')('lti-advantage-tool:controllers:wellknown')

const jose = require('../jose');

const jwks = async (_, res) => {
    debug('jwks');

    const jwks = jose.get_public_keys();

    res.send(jwks);
};

module.exports = {
    jwks
};
