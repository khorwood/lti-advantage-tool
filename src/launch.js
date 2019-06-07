'use strict';

const debug = require('debug')('lti-advantage-tool:launch');
const request = require('request-promise-native');
const uuid = require('uuid');

class Launch {
    constructor(jose, platform_configs) {
        this._jose = jose;
        this._platform_configs = platform_configs;
    }

    async connect(req, res) {
        debug('connect');

        const iss = req.body.iss || req.query.iss;
        if (!iss) { return res.status(400).send('missing iss'); }

        const login_hint = req.body.login_hint || req.query.login_hint;
        if (!login_hint) { return res.status(400).send('missing login_hint'); }

        const lti_message_hint = req.body.lti_message_hint || req.query.lti_message_hint;
        const lti_deployment_id = req.body.lti_deployment_id || req.query.lti_deployment_id;

        const target_link_uri = req.body.target_link_uri || req.query.target_link_uri;
        if (!target_link_uri) { return res.status(400).send('missing target_link_uri'); }

        let config = this._platform_configs.find(t => t.issuer == iss);
        if (!config) { return res.status(400).send('platform iss not registered'); }

        let csrf = uuid();
        let nonce = uuid();

        let payload = {
            scope: 'openid',
            response_type: 'id_token',
            client_id: config.client_id,
            redirect_uri: `https://${req.get('host')}/authenticate`,
            login_hint: login_hint,
            response_mode: 'form_post',
            lti_message_hint: lti_message_hint,
            state: csrf,
            nonce: nonce,
            prompt: 'none'
        };

        req.session.issuer = iss;
        req.session.client_id = config.client_id;
        req.session.lti_deployment_id = lti_deployment_id;
        req.session.login_hint = login_hint;
        req.session.target_link_uri = target_link_uri;
        req.session.csrf = csrf;
        req.session.nonce = nonce;

        res.render('autopost.pug', { action: config.authenticate_uri, data: payload });
    }

    async authenticate(req, res) {
        debug('authenticate');

        if (!req.body.id_token) { return res.status(400).send('missing id_token'); }
        if (!req.body.state) { return res.status(400).send('missing state'); }

        try {
            if (!req.session.client_id) { throw new Error('session expired, perform connect again'); }

            const epoch = this.epoch();
            const token = await this._jose.validate(req.body.id_token);

            if (token.header.alg != 'RS256') { throw new Error('token alg is not RS256') }

            let payload = JSON.parse(token.payload.toString('utf8'));

            if (!payload.iss) { throw new Error('token missing iss claim'); }
            if (!payload.aud) { throw new Error('token missing aud claim'); }
            if (!payload.sub) { throw new Error('token missing sub claim'); }
            if (!payload.exp) { throw new Error('token missing exp claim'); }
            if (!payload.iat) { throw new Error('token missing iat claim'); }
            if (!payload.nonce) { throw new Error('token missing nonce claim'); }

            if (payload.iss != req.session.issuer) { throw new Error('token iss claim mismatch'); }
            if (payload.aud != req.session.client_id) { throw new Error('token aud claim mismatch'); }
            if (payload.nonce != req.session.nonce) { throw new Error('token nonce claim mismatch'); }
            if (req.body.state != req.session.csrf) { throw new Error('token state claim mismatch'); }
            if (epoch > payload.exp) { throw new Error('token is expired'); }

            if (req.session.lti_deployment_id && payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'] != req.session.lti_deployment_id) {
                throw new Error('lti_deployment_id mismatch');
            }
            if (payload.azp && payload.azp != req.session.client_id) { throw new Error('token azp claim mismatch'); }

            debug(payload);
            req.session.launch_token = payload;

            return res.redirect(req.session.target_link_uri);
        } catch (e) {
            debug(e);
            res.status(401).send('Not Authorized');
        }
    }

    async simple_link(req, res) {
        debug('simple_link');

        if (!req.session.client_id) { return res.status(401).send('session not found'); }

        res.render('simple_launch.pug');
    }

    epoch() {
        return Math.floor(new Date().getTime() / 1000);
    }
}

module.exports = Launch;
