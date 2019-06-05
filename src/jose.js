'use strict';

const debug = require('debug')('lti-advantage-tool:jwk');
const jose = require('node-jose');
const request = require('request-promise-native');

class JOSE {
    constructor(platformConfigs) {
        this._keystore = jose.JWK.createKeyStore();
        this._keystore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' });

        for (let config of platformConfigs) {
            debug('fetching public keys');
            var jwks = request.get({
                uri: config.public_key_uri,
                json: true
            })
                .then((jwks) => {
                    for (let jwk of jwks.keys) {
                        debug('adding public key', jwk.kid);
                        this._keystore.add(jwk, 'json');
                    }
                }, (e) => {
                    debug('unable to fetch JWKS', e);
                });
        }
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

    async validate(token) {
        try {
            return await jose.JWS.createVerify(this._keystore)
                .verify(token);
        } catch{
            throw new Error('error validating token');
        }
    }
}

module.exports = JOSE;
