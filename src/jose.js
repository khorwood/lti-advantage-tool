'use strict';

class JOSE {
    constructor(fetch) {
        this._debug = require('debug')('lti-advantage-tool:jose');
        this._fetch = fetch;
        this._jose = require('node-jose');

        this._keystore = this._jose.JWK.createKeyStore();
        this._publicKeys = this._jose.JWK.createKeyStore();
    }

    /**
     * Initializes the JOSE wrapper
     * @param {object} platformConfigs The plaform configurations
     */
    async init(platformConfigs) {
        this._platformConfigs = platformConfigs;
        await this._keystore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' });
    }

    /**
     * Returns the server's public keys
     */
    getPublicKeys() {
        this._debug('getPublicKeys');

        return this._keystore.toJSON();
    }

    /**
     * Signs a payload as a JWT
     * @param {string} payload The payload as a string
     */
    async sign(payload) {
        this._debug('sign');

        const key = this._keystore.all()[0];

        const options = { compact: true, jwk: key };

        return this._jose.JWS.createSign(options, key)
            .update(payload)
            .final();
    }

    /**
     * Validates a signed JWT against the keystore
     * @param {string} token The JWT to validate
     */
    async validate(token) {
        this._debug('validate');

        await this.fetchPlatformKeys();

        const result = await this._jose.JWS.createVerify(this._publicKeys)
            .verify(token);

        return result;
    }

    async fetchPlatformKeys() {
        this._debug('fetchPlatformKeys');

        await Promise.all(this._platformConfigs.map(async config => {
            this._debug('fetching key set', config.public_key_uri);
            try {
                const response = await this._fetch(
                    config.public_key_uri,
                    {
                        timeout: 500
                    });
                if (!response.ok) {
                    throw new Error(`${response.statusCode} - ${response.statusText}`);
                }

                const jwks = await response.json();
                await Promise.all(jwks.keys.map(async jwk => {
                    try {
                        const key = this._publicKeys.get(jwk.kid);
                        if (!key) {
                            this._debug('adding key', jwk.kid);
                            await this._publicKeys.add(jwk, 'json');
                        }
                    } catch (error) {
                        this._debug('error adding key', jwk.kid);
                        this._debug(error.message);
                    }
                }));
            } catch (error) {
                this._debug('unable to fetch JWKS', config.public_key_uri);
                this._debug(error.message);
            }
        }));
    }
}

module.exports = JOSE;
