'use strict';

const constants = require('./constants');

class Utility {
    constructor(fetch, jose, uuid) {
        this._debug = require('debug')('lti-advantage-tool:utility');
        this._fetch = fetch;
        this._jose = jose;
        this._uuid = uuid;
    }

    static buildUri(uri, query) {
        if (query) {
            return `${uri}?${new URLSearchParams(query)}`;
        }

        return uri;
    }

    async fetch(uri, options, query) {
        const response = await this._fetch(Utility.buildUri(uri, query), options);
        if (response.ok) {
            return response.json();
        }

        throw new Error(`${response.statusCode} - ${response.statusText}`);
    }

    epoch() {
        return Math.floor(new Date().getTime() / 1000);
    }

    async getToken(request) {
        const client = request.app.get('config').platform_configs.find(
            x => x.client_id === request.session.client_id
        );

        const client_assertion = {
            iss: client.client_id,
            sub: client.client_id,
            aud: client.audience,
            iat: this.epoch(),
            exp: this.epoch() + 100000,
            jti: this._uuid()
        };

        const signed_assertion = await this._jose.sign(JSON.stringify(client_assertion));

        const assertion = {
            grant_type: constants.OAuth2.GrantTypes.ClientCredentials,
            client_assertion_type: constants.OAuth2.AssertionTypes.JwtBearer,
            client_assertion: signed_assertion,
            scope: `${constants.AGS.Scopes.LineItem} ${constants.AGS.Scopes.Result} ${constants.AGS.Scopes.Score}`
        };

        this._debug(assertion);

        const response = await this.fetch(
            client.token_uri,
            {
                method: 'post',
                body: `${new URLSearchParams(assertion)}`
            }
        );

        this._debug(response);

        return response.access_token;
    }
}

module.exports = Utility;
