'use strict';

const test = require('ava');
const sinon = require('sinon');

const WellknownController = require('../../src/controllers/wellknown');

const mockRequest = request => {
    return request;
};

const mockResponse = () => {
    const response = {};
    response.send = sinon.stub().returns(response);
    return response;
};

test('jwks returns public keyset', async t => {
    const request = mockRequest();
    const response = mockResponse();
    const payload = { keys: [] };

    const controller = new WellknownController({ getPublicKeys: () => payload });
    await controller.jwks(request, response);

    t.is(payload, response.send.getCall(0).args[0]);
});
