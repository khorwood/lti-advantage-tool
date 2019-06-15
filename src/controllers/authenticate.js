'use strict';

const debug = require('debug')('lti-advantage-tool:controllers:authenticate');
const jose = require('../jose');
const Constants = require('../constants');

const authenticate = async (req, res) => {
    debug('authenticate');

    if (!req.body.id_token) { return res.status(400).send('missing id_token'); }
    if (!req.body.state) { return res.status(400).send('missing state'); }

    try {
        if (!req.session.client_id) { throw new Error('session expired, perform connect again'); }

        const epoch = Math.floor(new Date() / 1000);
        const token = await jose.validate(req.body.id_token);

        if (token.header.alg != 'RS256') { throw new Error('token alg is not RS256') }

        let payload = JSON.parse(token.payload.toString('utf8'));

        if (!payload.iss) { throw new Error('token missing iss claim'); }
        if (!payload.aud) { throw new Error('token missing aud claim'); }
        if (!payload.sub) { throw new Error('token missing sub claim'); }
        if (!payload.exp) { throw new Error('token missing exp claim'); }
        if (!payload.iat) { throw new Error('token missing iat claim'); }
        if (!payload.nonce) { throw new Error('token missing nonce claim'); }

        if (payload.iss != req.session.issuer) { throw new Error('invalid token iss claim'); }
        if (payload.aud != req.session.client_id) { throw new Error('invalid token aud claim'); }
        if (payload.nonce != req.session.nonce) { throw new Error('invalid token nonce claim'); }
        if (req.body.state != req.session.csrf) { throw new Error('invalid token state claim'); }
        if (epoch > payload.exp) { throw new Error('token is expired'); }

        if (req.session.lti_deployment_id && payload[Constants.LTI.Claims.DeploymentId] != req.session.lti_deployment_id) {
            throw new Error('invalid token lti_deployment_id claim');
        }
        if (payload.azp && payload.azp != req.session.client_id) { throw new Error('invalid token azp claim'); }

        debug(payload);
        req.session.launch_token = payload;

        return res.redirect(req.session.target_link_uri);
    } catch (e) {
        res.status(401).send(e.message);
    }
};

module.exports = {
    authenticate
};
