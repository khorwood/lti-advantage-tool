'use strict';

const debug = require('debug')('lti-advantage-tool:controllers')

module.exports.connect = async (req,res) => {
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
};
