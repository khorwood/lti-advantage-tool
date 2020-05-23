'use strict';

const test = require('ava');
const fetch = require('fetch-mock');

const JOSE = require('../src/jose');

test('fetchPlatformKeys retrieves keys', async t => {
    fetch.get('https://example.com/.well-known/jwks.json', {
        status: 200,
        body: JSON.stringify({
            keys: [{
                kid: '5b910b2e-800f-4378-bb56-c0e41ea04e49',
                kty: 'RSA',
                n: 'lMJikFEE9j7UOznfcA9vgbj2dwI6GcyEHiaK2oC1Qhd3-fP_yd8G0x5trWZYSFopTZzTW1K0Ag4lIejaS4WNMFfTos9DBbwE_HPegE3lTboKRlvnodlU45wmktII1akAFaf_5MPZmKwLIROXqHQpbSG_1DaB_Q1d9NIAT5zdFSZOixkY1V_zNxDo7eFRvmwe0Ka_7OYDEw4botm8cCb8qIhLlB-GoExKKmMJBC5g_OcnkZ3gmKNENxeBalJlanGk7657OSV0KaLpmXOoHvQR317RXU_A1TaulPHT6kNokn4kPVqx78bYaSGl-6l0yGj1wrpJsGz2SYZlBhyHyLidvQ',
                e: 'AQAB',
                alg: 'RS256',
                use: 'sig',
                exp: 1590135759
            }]
        })
    });

    const jose = new JOSE(fetch.sandbox());
    await jose.init([{ public_key_uri: 'https://example.com/.well-known/jwks.json' }]);
    await jose.fetchPlatformKeys();

    const key = jose._publicKeys.get('5b910b2e-800f-4378-bb56-c0e41ea04e49');
    t.is(key.kid, '5b910b2e-800f-4378-bb56-c0e41ea04e49');
});
