'use strict';

const constants = require('../src/constants');
const fetch = require('fetch-mock');
const test = require('ava');

const Utility = require('../src/utility');

test('buildUri without query returns uri', t => {
    const result = Utility.buildUri('https://example.com');

    t.is(result, 'https://example.com');
});

test('buildUri with query returns uri and query', t => {
    const result = Utility.buildUri('https://example.com', { a: '1', b: '2' });

    t.is(result, 'https://example.com?a=1&b=2');
});

test('fetch calls through to fetch', async t => {
    fetch.get('https://example.com?a=1&b=2', {
        status: 200,
        body: JSON.stringify({ result: '' })
    });
    const utility = new Utility(fetch.sandbox());
    const json = await utility.fetch('https://example.com', {}, { a: '1', b: '2' });

    t.deepEqual(json, { result: '' });
});

test('getToken returns token', async t => {
    fetch.post((url, options) => {
        t.is(url, 'https://example.com/');
        const parameters = new URLSearchParams(options.body);
        t.is(parameters.get('grant_type'), constants.OAuth2.GrantTypes.ClientCredentials);
        t.is(parameters.get('client_assertion_type'), constants.OAuth2.AssertionTypes.JwtBearer);
        const assertion = JSON.parse(parameters.get('client_assertion'));
        t.is(assertion.iss, 'cid');
        t.is(assertion.sub, 'cid');
        t.is(assertion.aud, 'aud');
        t.is(assertion.jti, '123');
        t.is(parameters.get('scope'), `${constants.AGS.Scopes.LineItem} ${constants.AGS.Scopes.Result} ${constants.AGS.Scopes.Score}`);
        t.is(options.method, 'post');
        return true;
    }, {
        status: 200,
        body: {
            access_token: 'token'
        }
    });
    const jose = {
        sign: async x => {
            return x;
        }
    };
    const uuid = () => '123';
    const utility = new Utility(fetch.sandbox(), jose, uuid);

    const token = await utility.getToken({
        app: {
            get: () => {
                return {
                    platform_configs: [{ client_id: 'cid', audience: 'aud', token_uri: 'https://example.com' }]
                };
            }
        },
        session: {
            client_id: 'cid'
        }
    });

    t.is(token, 'token');
});
