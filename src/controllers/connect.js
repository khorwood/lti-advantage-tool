'use strict';

class ConnectController {
    constructor(uuid) {
        this._debug = require('debug')('lti-advantage-tool:controllers:connect');
        this._uuid = uuid;
    }

    async connect(request, response) {
        this._debug('connect');

        try {
            const iss = request.body.iss || request.query.iss;
            if (!iss) {
                throw new Error('missing iss');
            }

            const loginHint = request.body.login_hint || request.query.login_hint;
            if (!loginHint) {
                throw new Error('missing login_hint');
            }

            const ltiMessageHint = request.body.lti_message_hint || request.query.lti_message_hint;
            const ltiDeploymentId = request.body.lti_deployment_id || request.query.lti_deployment_id;

            const targetLinkUri = request.body.target_link_uri || request.query.target_link_uri;
            if (!targetLinkUri) {
                throw new Error('missing target_link_uri');
            }

            const config = request.app.get('config').platform_configs.find(t => t.issuer === iss);
            if (!config) {
                throw new Error('platform iss not registered');
            }

            if (ltiDeploymentId && ltiDeploymentId !== config.deployment_id) {
                throw new Error('platform lti_deployment_id not registered');
            }

            const csrf = this._uuid();
            const nonce = this._uuid();

            const payload = {
                scope: 'openid',
                response_type: 'id_token',
                client_id: config.client_id,
                redirect_uri: `https://${request.get('host')}/authenticate`,
                login_hint: loginHint,
                response_mode: 'form_post',
                lti_message_hint: ltiMessageHint,
                state: csrf,
                nonce,
                prompt: 'none'
            };

            request.session.issuer = iss;
            request.session.client_id = config.client_id;
            request.session.lti_deployment_id = ltiDeploymentId;
            request.session.login_hint = loginHint;
            request.session.target_link_uri = targetLinkUri;
            request.session.csrf = csrf;
            request.session.nonce = nonce;

            response.render('autopost.pug', { action: config.authenticate_uri, data: payload });
        } catch (error) {
            response.status(400).send(error.message);
        }
    }
}

module.exports = ConnectController;
