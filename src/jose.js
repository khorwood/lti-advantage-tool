'use strict';

const debug = require('debug')('lti-advantage-tool:jose');
const jose = require('node-jose');
const request = require('request-promise-native');

class JOSE {
    constructor(platformConfigs) {
        this._platformConfigs = platformConfigs;

        this._keystore = jose.JWK.createKeyStore();
        this._keystore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' });

        this._publicKeys = jose.JWK.createKeyStore();
    }

    /**
     * Handles a web request to get the JWKS store
     * @param {} req The request
     * @param {*} res The response
     */
    async get_jwks(req, res) {
        debug('get_jwks');

        const response = this._keystore.toJSON();

        res.send(response);
    }

    /**
     * Signs a payload as a JWT
     * @param {string} payload The payload as a string
     */
    async sign(payload) {
        debug('sign');

        const key = this._keystore.all()[0];

        const opts = { compact: true, jwk: key };

        return await jose.JWS.createSign(opts, key)
            .update(payload)
            .final();
    }

    /**
     * Validates a signed JWT against the keystore
     * @param {string} token The JWT to validate
     */
    async validate(token) {
        debug('validate');

        await this.fetch_platform_keys();

        let result = await jose.JWS.createVerify(this._publicKeys)
            .verify(token);

        return result;
    }

    async fetch_platform_keys() {
        debug('fetch_platform_keys');

        for (let config of this._platformConfigs) {
            debug('fetching public keys', config.public_key_uri);
            try {
                let jwks = await request.get({
                    json: true,
                    timeout: 500,
                    uri: config.public_key_uri
                });
                for (let jwk of jwks.keys) {
                    let key = this._publicKeys.get(jwk.kid)
                    if (!key) {
                        debug('adding key', jwk.kid);
                        await this._publicKeys.add(jwk, 'json');
                    }
                }
            } catch (e) {
                debug('unable to fetch JWKS', config.public_key_uri);
                debug(e.message);
            }
        }
    }
}

module.exports = JOSE;
