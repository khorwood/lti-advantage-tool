'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const jose = require('../../src/jose');
const controller = require('../../src/controllers/authenticate');

describe('controllers:authenticate', () => {
    afterEach(() => sinon.restore());

    const build_error = (code, message) => {
        return {
            status: (c) => {
                expect(c).to.equal(code);
                return {
                    send: (msg) => {
                        expect(msg).to.equal(message);
                    }
                };
            }
        };
    };

    it('returns 400 when id_token missing', async () => {
        let req = { body: {} };
        let res = build_error(400, 'missing id_token');

        await controller.authenticate(req, res);
    });

    it('returns 400 when state missing', async () => {
        let req = { body: { id_token: 'ey' } };
        let res = build_error(400, 'missing state');

        await controller.authenticate(req, res);
    });

    it('returns 401 when no session', async () => {
        let req = { body: { id_token: 'ey', state: 'state' }, session: {} };
        let res = build_error(401, 'session expired, perform connect again');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token is invalid', async () => {
        sinon.stub(jose, 'validate').rejects(new Error('invalid token'));

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'invalid token');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token alg is not RS256', async () => {
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'EC256' } });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'token alg is not RS256');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token iss is missing', async () => {
        let payload = {};
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'token missing iss claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token aud is missing', async () => {
        let payload = { iss: 'iss' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'token missing aud claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token sub is missing', async () => {
        let payload = { iss: 'iss', aud: 'aud' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'token missing sub claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token exp is missing', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'token missing exp claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token iat is missing', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1 };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'token missing iat claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token nonce is missing', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1 };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id' } };
        let res = build_error(401, 'token missing nonce claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token iss is invalid', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id', issuer: 'issuer' } };
        let res = build_error(401, 'invalid token iss claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token aud is invalid', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'client_id', issuer: 'iss' } };
        let res = build_error(401, 'invalid token aud claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token nonce is invalid', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'aud', issuer: 'iss' } };
        let res = build_error(401, 'invalid token nonce claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token state is invalid', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce' } };
        let res = build_error(401, 'invalid token state claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token is expired', async () => {
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: 1, iat: 1, nonce: 'nonce' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = { body: { id_token: 'ey', state: 'state' }, session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'state' } };
        let res = build_error(401, 'token is expired');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token lti_deployment_id is invalid', async () => {
        let future = Math.floor(new Date().getTime() / 1000) + 10000;
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: future, iat: 1, nonce: 'nonce' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = {
            body: { id_token: 'ey', state: 'state' },
            session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'state', lti_deployment_id: 'abc' }
        };
        let res = build_error(401, 'invalid token lti_deployment_id claim');

        await controller.authenticate(req, res);
    });

    it('returns 401 when id_token azp is invalid', async () => {
        let future = Math.floor(new Date().getTime() / 1000) + 10000;
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: future, iat: 1, nonce: 'nonce', azp: 'azp' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = {
            body: { id_token: 'ey', state: 'state' },
            session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'state' }
        };
        let res = build_error(401, 'invalid token azp claim');

        await controller.authenticate(req, res);
    });

    it('redirects when id_token valid', async () => {
        let future = Math.floor(new Date().getTime() / 1000) + 10000;
        let payload = { iss: 'iss', aud: 'aud', sub: 'sub', exp: future, iat: 1, nonce: 'nonce' };
        sinon.stub(jose, 'validate').resolves({ header: { alg: 'RS256' }, payload: JSON.stringify(payload) });

        let req = {
            body: { id_token: 'ey', state: 'state' },
            session: { client_id: 'aud', issuer: 'iss', nonce: 'nonce', csrf: 'state', target_link_uri: 'uri' }
        };
        let res = {
            redirect: (uri) => expect(uri).to.equal(req.session.target_link_uri)
        };

        await controller.authenticate(req, res);
    });
});
