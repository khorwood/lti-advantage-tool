'use strict';

const debug = require('debug')('lti-advantage-tool:jwk');
const jose = require('node-jose');

class JOSE {
    constructor() {
        this._keystore = jose.JWK.createKeyStore();
        this._keystore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' });
    }

    /**
     * Handles a web request to get the JWKS store
     * @param {} req The request
     * @param {*} res The response
     */
    async getJwks(req, res) {
        debug('getJwks');

        const response = this._keystore.toJSON();

        res.send(response);
    }

    /**
     * Signs a payload as a JWT
     * @param {string} payload The payload as a string
     */
    async sign(payload) {
        const key = this._keystore.all()[0];

        const opts = { compact: true, jwk: key, fields: { typ: 'jwt' } };

        return await jose.JWS.createSign(opts, key)
            .update(payload)
            .final();
    }
}

module.exports = JOSE;
