'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const jose = require('../../src/jose');
const wellknown = require('../../src/controllers/wellknown');

describe('controllers:wellknown', () => {
    afterEach(() => sinon.restore());

    it('jwks: returns public keyset', async () => {
        sinon.stub(jose, 'get_public_keys').returns({ keys: [] });

        let req = {};
        let res = {
            send: (jwks) => {
                expect(jwks).to.deep.equal({ keys: [] });
            }
        }

        await wellknown.jwks(req, res);
    })
});
