'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const controller = require('../../src/controllers/connect');

describe('controllers:connect', () => {
    afterEach(() => sinon.restore());

    const build_error = (code, message) => {
        return {
            status: (c) => {
                expect(c).to.equal(code);
                return {
                    send: (msg) => {
                        expect(msg).to.equal(message);
                    }
                }
            }
        };
    };

    it('returns 400 when iss missing', async () => {
        let req = { body: {}, query: {} };
        let res = build_error(400, 'missing iss');

        await controller.connect(req, res);
    });

    it('returns 400 when login_hint missing', async () => {
        let req = { body: { iss: 'iss' }, query: {} };
        let res = build_error(400, 'missing login_hint');

        await controller.connect(req, res);
    });

    it('returns 400 when target_link_uri missing', async () => {
        let req = { body: { iss: 'iss', login_hint: 'hint' }, query: {} };
        let res = build_error(400, 'missing target_link_uri');

        await controller.connect(req, res);
    });

    it('returns 400 when iss is not registered to a platform', async () => {
        let req = { app: {}, body: { iss: 'iss', login_hint: 'hint', target_link_uri: 'uri' }, query: {} };
        req.app.get = sinon.stub().returns({ platform_configs: [{ issuer: 'issuer' }] });
        let res = build_error(400, 'platform iss not registered');

        await controller.connect(req, res);
    });

    it('returns 400 when lti_deployment_id is not registered to a platform', async () => {
        let req = { app: {}, body: { iss: 'iss', login_hint: 'hint', target_link_uri: 'uri', lti_deployment_id: 'dep' }, query: {} };
        req.app.get = sinon.stub().returns({ platform_configs: [{ issuer: 'issuer', deployment_id: 'deploy' }] });
        let res = build_error(400, 'platform iss not registered');

        await controller.connect(req, res);
    });

    it('renders autopost form on success', async () => {
        let req = {
            app: {
                get: sinon.stub().returns({ platform_configs: [{ client_id: 'cid', issuer: 'iss', deployment_id: 'dep', authenticate_uri: 'auth' }] })
            },
            body: { iss: 'iss', login_hint: 'hint', target_link_uri: 'uri', lti_deployment_id: 'dep', lti_message_hint: 'msg_hint' },
            get: sinon.stub().returns('host'),
            query: {},
            session: {}
        };
        let res = {
            render: (view, options) => {
                expect(view).to.equal('autopost.pug');
                expect(options.action).to.equal('auth');
                expect(options.data.scope).to.equal('openid');
                expect(options.data.response_type).to.equal('id_token');
                expect(options.data.client_id).to.equal('cid');
                expect(options.data.redirect_uri).to.equal('https://host/authenticate');
                expect(options.data.login_hint).to.equal('hint');
                expect(options.data.response_mode).to.equal('form_post');
                expect(options.data.lti_message_hint).to.equal('msg_hint')
                expect(options.data.state).to.equal(req.session.csrf);
                expect(options.data.nonce).to.equal(req.session.nonce);
                expect(options.data.prompt).to.equal('none');
            }
        }

        await controller.connect(req, res);
    });
});
