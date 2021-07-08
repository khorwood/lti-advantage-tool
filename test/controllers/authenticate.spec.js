'use strict';

const test = require('ava');
const sinon = require('sinon');

const constants = require('../../src/constants');
const AuthenticateController = require('../../src/controllers/authenticate');

const future = Math.floor(new Date().getTime() / 1000) + 10000;

const mockRequest = request => {
    return request;
};

const mockResponse = () => {
    const response = {};
    response.status = sinon.stub().returns(response);
    response.send = sinon.stub().returns(response);
    response.redirect = sinon.stub().returns(response);
    return response;
};

const mockJose = payload => {
    return {
        validate: async () => {
            return { header: { alg: 'RS256' }, payload: JSON.stringify(payload) };
        }
    };
};

test('authenticate returns 400 when id_token missing', async t => {
    const request = mockRequest({ body: {} });
    const response = mockResponse();

    const controller = new AuthenticateController({});
    await controller.authenticate(request, response);

    t.true(response.status.calledWith(400));
    t.is(response.send.getCall(0).args[0], 'missing id_token');
});

test('authenticate returns 400 when state missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey' } });
    const response = mockResponse();

    const controller = new AuthenticateController({});
    await controller.authenticate(request, response);

    t.true(response.status.calledWith(400));
    t.is(response.send.getCall(0).args[0], 'missing state');
});

test('authenticate returns 401 when session missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: {} });
    const response = mockResponse();

    const controller = new AuthenticateController(mockJose({}));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('session expired, perform connect again', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token invalid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();

    const controller = new AuthenticateController({
        validate: async () => {
            throw new Error('invalid token');
        }
    });
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('invalid token', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token alg is not RS256', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();

    const controller = new AuthenticateController({
        validate: async () => {
            return { header: { alg: 'EC256' } };
        }
    });
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token alg is not RS256', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token iss claim is missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();
    const payload = {};

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token missing iss claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token aud claim is missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();
    const payload = { iss: 'iss' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token missing aud claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token sub claim is missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token missing sub claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token exp claim is missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token missing exp claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token iat claim is missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1 };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token missing iat claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token nonce claim is missing', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1 };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token missing nonce claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token iss claim is invalid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id', issuer: 'issuer' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('invalid token iss claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token aud claim is invalid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'client_id', issuer: 'iss' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('invalid token aud claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token nonce claim is invalid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'aud', issuer: 'iss' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('invalid token nonce claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token state claim is invalid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('invalid token state claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token is expired', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'st' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('token is expired', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token lti_deployment_id is invalid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'st', lti_deployment_id: 'lti' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: future, iat: 1, nonce: 'nonce' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('invalid token lti_deployment_id claim', response.send.getCall(0).args[0]);
});

test('authenticate returns 401 when id_token azp is invalid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'st', lti_deployment_id: 'lti' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: future, iat: 1, nonce: 'nonce', azp: 'azp', [constants.LTI.Claims.DeploymentId]: 'lti' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('invalid token azp claim', response.send.getCall(0).args[0]);
});

test('authenticate redirects when token is valid', async t => {
    const request = mockRequest({ body: { id_token: 'ey', state: 'st' }, session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'st', lti_deployment_id: 'lti', target_link_uri: 'uri' } });
    const response = mockResponse();
    const payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: future, iat: 1, nonce: 'nonce', azp: 'aud', [constants.LTI.Claims.DeploymentId]: 'lti' };

    const controller = new AuthenticateController(mockJose(payload));
    await controller.authenticate(request, response);

    t.is('uri', response.redirect.getCall(0).args[0]);
});
