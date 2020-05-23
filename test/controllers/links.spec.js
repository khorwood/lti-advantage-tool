'use strict';

const test = require('ava');
const sinon = require('sinon');

const LinksController = require('../../src/controllers/links');

const constants = require('../../src/constants');

const mockRequest = request => {
    return request || {
        body: {
            max_score: '1',
            label: 'label',
            tag: 'tag',
            resource_id: 'id',
            score_given: '2',
            score_maximum: '4',
            comment: 'comment'
        },
        session: {
            client_id: 'cid',
            launch_token: {
                [constants.LTI.Claims.ResourceLink]: { id: 'link_id' },
                [constants.AGS.Claims.Endpoint]: { lineitems: 'https://lineitems.com/lineitems' },
                [constants.NRPS.Claims.Endpoint]: {
                    context_memberships_url: 'https://memberships.com/memberships',
                    service_versions: ['2.0']
                }
            }
        }
    };
};

const mockResponse = () => {
    const response = mockRequest({});
    response.send = sinon.stub().returns(response);
    response.status = sinon.stub().returns(response);
    response.render = sinon.stub().returns(response);
    return response;
};

const mockUtility = () => {
    const utility = {};
    utility.getToken = sinon.stub().returns('token');
    return utility;
};

test('simpleLink returns error with no session', async t => {
    const request = { session: {} };
    const response = mockResponse();

    const links = new LinksController();
    await links.simpleLink(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('session not found', response.send.getCall(0).args[0]);
});

test('simpleLink renders with session', async t => {
    const request = mockRequest();
    const response = mockResponse();

    const links = new LinksController();
    await links.simpleLink(request, response);

    t.is('simple_launch.pug', response.render.getCall(0).args[0]);
});

test('lineItemForm returns error with no session', async t => {
    const request = mockRequest({ session: {} });
    const response = mockResponse();

    const links = new LinksController();
    await links.lineItemForm(request, response);

    t.is(401, response.status.getCall(0).args[0]);
    t.is('session not found', response.send.getCall(0).args[0]);
});

test('lineItemForm returns error with no resource link', async t => {
    const request = mockRequest({ session: { client_id: 'cid', launch_token: {} } });
    const response = mockResponse();

    const links = new LinksController();
    await links.lineItemForm(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('missing lti-ags resource link claim', response.send.getCall(0).args[0]);
});

test('lineItemForm returns error with no endpoint', async t => {
    const request = mockRequest({
        body: {
            max_score: '1',
            label: 'label',
            tag: 'tag',
            resource_id: 'id'
        },
        session: {
            client_id: 'cid',
            launch_token: {
                [constants.LTI.Claims.ResourceLink]: { id: 'id' }
            }
        }
    });
    const response = mockResponse();

    const links = new LinksController();
    await links.lineItemForm(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('missing lti-ags endpoint claim', response.send.getCall(0).args[0]);
});

test('lineItemForm returns error if it failed to fetch access token', async t => {
    const request = mockRequest();
    const response = mockResponse();
    const utility = mockUtility();
    utility.getToken = sinon.stub().rejects(new Error('failure fetching token'));

    const links = new LinksController(utility);
    await links.lineItemForm(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('failure fetching token', response.send.getCall(0).args[0]);
});

test('lineItemForm returns error if it failed to fetch lineitems', async t => {
    const request = mockRequest();
    const response = mockResponse();
    const utility = mockUtility();
    utility.fetch = sinon.stub().rejects(new Error('404 - {}'));

    const links = new LinksController(utility);
    await links.lineItemForm(request, response);

    t.is(400, response.status.getCall(0).args[0]);
    t.is('404 - {}', response.send.getCall(0).args[0]);
});

test('lineItemForm posts lineitem is none returned', async t => {
    const request = mockRequest();
    const response = mockResponse();
    const utility = mockUtility();
    utility.fetch = sinon.stub()
        .onFirstCall().callsFake(async (uri, options, query) => {
            t.is(uri, 'https://lineitems.com/lineitems');
            t.deepEqual(options, {
                headers: {
                    authorization: 'Bearer token'
                }
            });
            t.deepEqual(query, { resource_id: 'id' });

            return [];
        })
        .onSecondCall().callsFake(async (uri, options, query) => {
            t.is(uri, 'https://lineitems.com/lineitems');
            t.is(options.method, 'post');
            t.deepEqual(options.headers, {
                authorization: 'Bearer token',
                'Content-Type': 'application/json'
            });
            t.is(query, undefined);

            const body = JSON.parse(options.body);
            t.is(body.scoreMaximum, '1');
            t.is(body.label, 'label');
            t.is(body.tag, 'tag');
            t.is(body.resourceId, 'id');
            t.is(body.resourceLinkId, 'link_id');

            return {};
        });

    const links = new LinksController(utility);
    await links.lineItemForm(request, response);

    t.is('simple_launch.pug', response.render.getCall(0).args[0]);
});

test('lineItemForm puts lineitem is some returned', async t => {
    const request = mockRequest();
    const response = mockResponse();
    const utility = mockUtility();
    utility.fetch = sinon.stub()
        .onFirstCall().callsFake((uri, options, query) => {
            t.is(uri, 'https://lineitems.com/lineitems');
            t.deepEqual(options, {
                headers: {
                    authorization: 'Bearer token'
                }
            });
            t.deepEqual(query, { resource_id: 'id' });

            return [{
                id: 'https://lineitems.com/lineitems/lineitem_id'
            }];
        })
        .onSecondCall().callsFake((uri, options, query) => {
            t.is(uri, 'https://lineitems.com/lineitems/lineitem_id');
            t.is(options.method, 'put');
            t.deepEqual(options.headers, {
                authorization: 'Bearer token',
                'Content-Type': 'application/json'
            });
            t.is(query, undefined);

            const body = JSON.parse(options.body);
            t.is(body.scoreMaximum, '1');
            t.is(body.label, 'label');
            t.is(body.tag, 'tag');
            t.is(body.resourceId, 'id');
            t.is(body.resourceLinkId, 'link_id');

            return [];
        });

    const links = new LinksController(utility);
    await links.lineItemForm(request, response);

    t.is('simple_launch.pug', response.render.getCall(0).args[0]);
});

// A describe('controllers:links', () => {
//     it('lineitem_link: returns error with no session', async () => {
//         let req = { session: {} };
//         let res = build_error(401, 'session not found');

//         await links.lineitem_link(req, res);
//     });

//     it('lineitem_link: renders with session', async () => {
//         let req = build_req();
//         let res = build_render('lineitem_launch.pug', { action: 'lineitem_form' });

//         await links.lineitem_link(req, res);
//     });

//     it('lineitemscore_form: returns error with no session', async () => {
//         let req = { session: {} };
//         let res = build_error(401, 'session not found');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_form: returns error with no endpoint', async () => {
//         let req = {
//             body: { score_given: '2', score_maximum: '4', comment: 'comment' },
//             session: { client_id: 'cid', launch_token: {} }
//         };
//         let res = build_error(400, 'missing lti-ags endpoint claim');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_form: returns error if failed to fetch access token', async () => {
//         sinon.stub(utility, 'get_token').rejects(new Error('failure fetching token'));

//         let req = build_req();
//         let res = build_error(400, 'failure fetching token');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_form: returns error if failed to fetch lineitems', async () => {
//         sinon.stub(utility, 'get_token').returns('token');
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems')
//             .query({ resource_id: 'id' })
//             .reply(404, {});

//         let req = build_req();
//         let res = build_error(400, '404 - {}');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_form: returns error if failed post lineitem score', async () => {
//         sinon.stub(utility, 'get_token').returns('token');
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems')
//             .query({ resource_id: 'id' })
//             .reply(200, [{
//                 id: 'https://lineitems.com/lineitems/lineitem_id'
//             }]);
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .post('/lineitems/lineitem_id/scores', {
//                 scoreGiven: '2',
//                 scoreMaximum: '4',
//                 comment: 'comment',
//                 timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
//                 activityProgress: 'Completed',
//                 gradingProgress: 'FullyGraded'
//             })
//             .reply(400, {});

//         let req = build_req();
//         let res = build_error(400, '400 - {}');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_form: returns error if failed to get results', async () => {
//         sinon.stub(utility, 'get_token').returns('token');
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems')
//             .query({ resource_id: 'id' })
//             .reply(200, [{
//                 id: 'https://lineitems.com/lineitems/lineitem_id'
//             }]);
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .post('/lineitems/lineitem_id/scores', {
//                 scoreGiven: '2',
//                 scoreMaximum: '4',
//                 comment: 'comment',
//                 timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
//                 activityProgress: 'Completed',
//                 gradingProgress: 'FullyGraded'
//             })
//             .reply(200);
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems/lineitem_id/results')
//             .reply(400, {});

//         let req = build_req();
//         let res = build_error(400, '400 - {}');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_form: returns error if failed to get result', async () => {
//         sinon.stub(utility, 'get_token').returns('token');
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems')
//             .query({ resource_id: 'id' })
//             .reply(200, [{
//                 id: 'https://lineitems.com/lineitems/lineitem_id'
//             }]);
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .post('/lineitems/lineitem_id/scores', {
//                 scoreGiven: '2',
//                 scoreMaximum: '4',
//                 comment: 'comment',
//                 timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
//                 activityProgress: 'Completed',
//                 gradingProgress: 'FullyGraded'
//             })
//             .reply(200);
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems/lineitem_id/results')
//             .reply(200, {
//                 results: [{
//                     id: 'https://lineitems.com/lineitems/lineitem_id/results/result_id'
//                 }]
//             });
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems/lineitem_id/results/result_id')
//             .reply(400, {});

//         let req = build_req();
//         let res = build_error(400, '400 - {}');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_form: renders on success', async () => {
//         sinon.stub(utility, 'get_token').returns('token');
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems')
//             .query({ resource_id: 'id' })
//             .reply(200, [{
//                 id: 'https://lineitems.com/lineitems/lineitem_id'
//             }]);
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .post('/lineitems/lineitem_id/scores', {
//                 scoreGiven: '2',
//                 scoreMaximum: '4',
//                 comment: 'comment',
//                 timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
//                 activityProgress: 'Completed',
//                 gradingProgress: 'FullyGraded'
//             })
//             .reply(200);
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems/lineitem_id/results')
//             .reply(200, {
//                 results: [{
//                     id: 'https://lineitems.com/lineitems/lineitem_id/results/result_id'
//                 }]
//             });
//         nock('https://lineitems.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/lineitems/lineitem_id/results/result_id')
//             .reply(200, {
//                 results: [{
//                     id: 'https://lineitems.com/lineitems/lineitem_id/results/result_id'
//                 }]
//             });

//         let req = build_req();
//         let res = build_render('simple_launch.pug');

//         await links.lineitemscore_form(req, res);
//     });

//     it('lineitemscore_link: returns error with no session', async () => {
//         let req = { session: {} };
//         let res = build_error(401, 'session not found');

//         await links.lineitemscore_link(req, res);
//     });

//     it('lineitemscore_link: renders with session', async () => {
//         let req = build_req();
//         let res = build_render('lineitemscore_launch.pug', { action: 'lineitemscore_form' });

//         await links.lineitemscore_link(req, res);
//     });

//     it('nrps_link: returns error with no session', async () => {
//         let req = { session: {} };
//         let res = build_error(401, 'session not found');

//         await links.nrps_link(req, res);
//     });

//     it('nrps_link: returns error with no endpoint claim', async () => {
//         let req = {
//             session: {
//                 client_id: 'cid',
//                 launch_token: {}
//             }
//         };
//         let res = build_error(400, 'missing lti-nrps endpoint claim');

//         await links.nrps_link(req, res);
//     });

//     it('nrps_link: returns error with no context_memberships_url', async () => {
//         let req = {
//             session: {
//                 client_id: 'cid',
//                 launch_token: {
//                     [constants.NRPS.Claims.Endpoint]: {}
//                 }
//             }
//         };
//         let res = build_error(400, 'missing context_memberships_url');

//         await links.nrps_link(req, res);
//     });

//     it('nrps_link: returns error with invalid service_versions', async () => {
//         let req = {
//             session: {
//                 client_id: 'cid',
//                 launch_token: {
//                     [constants.NRPS.Claims.Endpoint]: {
//                         context_memberships_url: 'https://memberships.com/memberships'
//                     }
//                 }
//             }
//         };
//         let res = build_error(400, 'platform does not declare support for service_versions 2.0');

//         await links.nrps_link(req, res);
//     });

//     it('nrps_link: returns error with missing resource link', async () => {
//         let req = {
//             session: {
//                 client_id: 'cid',
//                 launch_token: {
//                     [constants.NRPS.Claims.Endpoint]: {
//                         context_memberships_url: 'https://memberships.com/memberships',
//                         service_versions: ['2.0']
//                     }
//                 }
//             }
//         };
//         let res = build_error(400, 'missing lti resource link claim');

//         await links.nrps_link(req, res);
//     });

//     it('nrps_link: returns error if failed to fetch access token', async () => {
//         sinon.stub(utility, 'get_token').rejects(new Error('failure fetching token'));

//         let req = build_req();
//         let res = build_error(400, 'failure fetching token');

//         await links.nrps_link(req, res);
//     });

//     it('nrps_link: returns error if failed to get memberships', async () => {
//         sinon.stub(utility, 'get_token').returns('token');
//         nock('https://memberships.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/memberships')
//             .query({ rlid: 'link_id' })
//             .reply(404, {});

//         let req = build_req();
//         let res = build_error(400, '404 - {}');

//         await links.nrps_link(req, res);
//     });

//     it('nrps_link: renders with session', async () => {
//         sinon.stub(utility, 'get_token').returns('token');
//         nock('https://memberships.com')
//             .matchHeader('authorization', 'Bearer token')
//             .get('/memberships')
//             .query({ rlid: 'link_id' })
//             .reply(200, {
//                 id: 'https://memberships.com/memberships?rlid=link_id'
//             });

//         let req = build_req();
//         let res = {
//             send: (d) => {
//                 expect(d).to.deep.equal({ id: 'https://memberships.com/memberships?rlid=link_id' });
//             }
//         };

//         await links.nrps_link(req, res);
//     });
// });
