'use strict';

class WellknownController {
    constructor(jose) {
        this._debug = require('debug')('lti-advantage-tool:controllers:wellknown');
        this._jose = jose;
    }

    jwks(_, response) {
        this._debug('jwks');

        const jwks = this._jose.getPublicKeys();

        response.send(jwks);
    }
}

module.exports = WellknownController;
