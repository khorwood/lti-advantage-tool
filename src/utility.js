'use strict';

const debug = require('debug')('lti-advantage-tool:utility');
const request = require('request-promise-native');
const uuid = require('uuid');

const Constants = require('./constants');
const jose = require('./jose');

const epoch = () => {
    return Math.floor(new Date().getTime() / 1000);
};

const get_token = async (req) => {
    const client = req.app.get('config').platform_configs.find(
        t => t.client_id === req.session.client_id
    );

    const client_assertion = {
        iss: client.client_id,
        sub: client.client_id,
        aud: client.audience,
        iat: epoch(),
        exp: epoch() + 100000,
        jti: uuid()
    };
    
    const signed_assertion = await jose.sign(JSON.stringify(client_assertion));

    const assertion = {
        grant_type: Constants.OAuth2.GrantTypes.ClientCredentials,
        client_assertion_type: Constants.OAuth2.AssertionTypes.JwtBearer,
        client_assertion: signed_assertion,
        scope: `${Constants.AGS.Scopes.LineItem} ${Constants.AGS.Scopes.Result} ${Constants.AGS.Scopes.Score}`
    };

    debug(assertion);

    let response = await request.post(
        client.token_uri,
        {
            form: assertion,
            json: true
        }
    );

    debug(response);

    return response.access_token;
};

module.exports = {
    epoch,
    get_token
};
