'use strict';

const debug = require('debug')('lti-advantage-tool:launch');

class Launch {
    constructor(jose, platform_configs) {
        this._jose = jose;
        this._platform_configs = platform_configs;
    }

    async connect(req, res) {
        const iss = req.body.iss || req.query.iss;
        if (!iss) { return res.status(400).send('missing iss'); }

        const login_hint = req.body.login_hint || req.query.login_hint;
        if (!login_hint) { return res.status(400).send('missing login_hint'); }

        const target_link_uri = req.body.target_link_uri || req.query.target_link_uri;
        if (!target_link_uri) { return res.status(400).send('missing target_link_uri'); }

        let config = this._platform_configs.find(t => t.issuer == iss);
        if (!config) { return res.status(400).send('platform iss not registered'); }

        let payload = {
            scope: 'openid',
            response_type: 'id_token',
            client_id: config.client_id,
            redirect_uri: `http://${req.get('host')}/authenticate`,
            login_hint: login_hint,
            state: 'my_csrf',
            response_mode: 'form',
            nonce: 'my_nonce',
            prompt: 'none'
        };

        req.session.issuer = iss;
        req.session.client_id = config.client_id;
        req.session.login_hint = login_hint;
        req.session.target_link_uri = target_link_uri;
        req.session.csrf = 'my_csrf';
        req.session.nonce = 'my_nonce';

        res.render('autopost.pug', { action: config.authenticate_uri, data: payload });
    }

    async authenticate(req, res) {
        if (!req.body.id_token) { return res.status(400).send('missing id_token'); }
        if (!req.body.state) { return res.status(400).send('missing state'); }

        try {
            if (!req.session.client_id) { throw ('session expired, perform connect again'); }

            const epoch = new Date().getTime();
            const token = await this._jose.validate(id_token);
            if (token == {}) { throw ('error validating id_token'); }

            if (!token.iss) { throw ('token missing iss claim'); }
            if (!token.aud) { throw ('token missing aud claim'); }
            if (!token.sub) { throw ('token missing sub claim'); }
            if (!token.exp) { throw ('token missing exp claim'); }
            if (!token.iat) { throw ('token missing iat claim'); }
            if (!token.nonce) { throw ('token missing nonce claim'); }

            if (token.iss != req.session.issuer) { throw ('token iss claim mismatch'); }
            if (token.aud != req.session.client_id) { throw ('token aud claim mismatch'); }
            if (token.nonce != req.session.nonce) { throw ('token nonce claim mismatch'); }
            if (token.state != req.session.csrf) { throw ('token state claim mismatch'); }
            if (epoch > token.exp) { throw ('token is expired'); }

            if (token.azp && token.azp != req.session.client_id) { throw ('token azp claim mismatch'); }

            req.session = null;
            return res.redirect(req.session.target_link_uri);
        } catch (e) {
            req.session = null;
            res.status(401).send(e);
        }
    }

    async simple_launch(req, res) {
        const token = req.body.id_token;
        if (!token) { res.status(403).send('missing id_token'); }

        //validate token

        res.send();
    }
}

module.exports = Launch;
