'use strict';

const constants = require('../constants');

class AuthenticateController {
    constructor(jose) {
        this._debug = require('debug')('lti-advantage-tool:controllers:authenticate');
        this._jose = jose;
    }

    async authenticate(request, response) {
        this._debug('authenticate');

        if (!request.body.id_token) {
            return response.status(400).send('missing id_token');
        }

        if (!request.body.state) {
            return response.status(400).send('missing state');
        }

        try {
            if (!request.session.client_id) {
                throw new Error('session expired, perform connect again');
            }

            const epoch = Math.floor(new Date() / 1000);
            const token = await this._jose.validate(request.body.id_token);

            if (token.header.alg !== 'RS256') {
                throw new Error('token alg is not RS256');
            }

            const payload = JSON.parse(token.payload.toString('utf8'));

            if (!payload.iss) {
                throw new Error('token missing iss claim');
            }

            if (!payload.aud) {
                throw new Error('token missing aud claim');
            }

            if (!payload.sub) {
                throw new Error('token missing sub claim');
            }

            if (!payload.exp) {
                throw new Error('token missing exp claim');
            }

            if (!payload.iat) {
                throw new Error('token missing iat claim');
            }

            if (!payload.nonce) {
                throw new Error('token missing nonce claim');
            }

            if (payload.iss !== request.session.issuer) {
                throw new Error('invalid token iss claim');
            }

            if (payload.aud !== request.session.client_id) {
                throw new Error('invalid token aud claim');
            }

            if (payload.nonce !== request.session.nonce) {
                throw new Error('invalid token nonce claim');
            }

            if (request.body.state !== request.session.csrf) {
                throw new Error('invalid token state claim');
            }

            if (epoch > payload.exp) {
                throw new Error('token is expired');
            }

            if (request.session.lti_deployment_id && payload[constants.LTI.Claims.DeploymentId] !== request.session.lti_deployment_id) {
                throw new Error('invalid token lti_deployment_id claim');
            }

            if (payload.azp && payload.azp !== request.session.client_id) {
                throw new Error('invalid token azp claim');
            }

            this._debug(payload);
            request.session.launch_token = payload;

            return response.redirect(request.session.target_link_uri);
        } catch (error) {
            response.status(401).send(error.message);
        }
    }
}

module.exports = AuthenticateController;
