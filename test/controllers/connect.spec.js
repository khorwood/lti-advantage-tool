'use strict';

const test = require('ava');
const sinon = require('sinon');

const ConnectController = require('../../src/controllers/connect');

const mockRequest = request => {
    return request;
};

const mockResponse = () => {
    const response = {};
    response.send = sinon.stub().returns(response);
    response.status = sinon.stub().returns(response);
    response.render = sinon.stub().returns(response);
    return response;
};

test('connect returns 400 when iss missing', async t => {
    const request = mockRequest({ body: {}, query: {} });
    const response = mockResponse();

    const controller = new ConnectController(sinon.stub().returns('abc'));
    await controller.connect(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('missing iss', response.send.getCall(0).args[0]);
});

test('connect returns 400 when login_hint missing', async t => {
    const request = mockRequest({ body: { iss: 'iss' }, query: {} });
    const response = mockResponse();

    const controller = new ConnectController(sinon.stub().returns('abc'));
    await controller.connect(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('missing login_hint', response.send.getCall(0).args[0]);
});

test('connect returns 400 when target_link_uri missing', async t => {
    const request = mockRequest({ body: { iss: 'iss', login_hint: 'lh' }, query: {} });
    const response = mockResponse();

    const controller = new ConnectController(sinon.stub().returns('abc'));
    await controller.connect(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('missing target_link_uri', response.send.getCall(0).args[0]);
});

test('connect returns 400 when iss not registered', async t => {
    const request = mockRequest({ app: {}, body: { iss: 'iss', login_hint: 'lh', target_link_uri: 'uri' }, query: {} });
    request.app.get = sinon.stub().returns({ platform_configs: [{ issuer: 'issuer' }] });
    const response = mockResponse();

    const controller = new ConnectController(sinon.stub().returns('abc'));
    await controller.connect(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('platform iss not registered', response.send.getCall(0).args[0]);
});

test('connect returns 400 when lti_deployment_id not registered', async t => {
    const request = mockRequest({ app: {}, body: { iss: 'iss', login_hint: 'lh', target_link_uri: 'uri', lti_deployment_id: 'lti' }, query: {} });
    request.app.get = sinon.stub().returns({ platform_configs: [{ issuer: 'iss' }] });
    const response = mockResponse();

    const controller = new ConnectController(sinon.stub().returns('abc'));
    await controller.connect(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('platform lti_deployment_id not registered', response.send.getCall(0).args[0]);
});

test('connect renders autopost form on success', async t => {
    const request = mockRequest({ app: {}, body: { iss: 'iss', login_hint: 'lh', target_link_uri: 'uri', lti_deployment_id: 'lti', lti_message_hint: 'lmh' }, query: {}, session: {} });
    request.app.get = sinon.stub().returns({ platform_configs: [{ client_id: 'cid', issuer: 'iss', deployment_id: 'lti', authenticate_uri: 'auth' }] });
    request.get = sinon.stub().returns('host');
    const response = mockResponse();

    const controller = new ConnectController(sinon.stub().onCall(0).returns('abc').returns('def'));
    await controller.connect(request, response);

    t.is('abc', request.session.csrf);
    t.is('autopost.pug', response.render.getCall(0).args[0]);
    const options = response.render.getCall(0).args[1];
    t.is('auth', options.action);
    t.is('cid', options.data.client_id);
    t.is('lh', options.data.login_hint);
    t.is('lmh', options.data.lti_message_hint);
    t.is('none', options.data.prompt);
    t.is('def', options.data.nonce);
    t.is('https://host/authenticate', options.data.redirect_uri);
    t.is('form_post', options.data.response_mode);
    t.is('id_token', options.data.response_type);
    t.is('openid', options.data.scope);
});
