'use strict';

const nock = require('nock');
const sinon = require('sinon');
const { expect } = require('chai');

const links = require('../../src/controllers/links');
const Constants = require('../../src/constants');
const utility = require('../../src/utility');

describe('controllers:links', () => {
    before(() => nock.disableNetConnect());
    after(() => nock.enableNetConnect());
    afterEach(() => {
        nock.cleanAll();
        sinon.restore();
    });

    const build_req = () => {
        return {
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
                    [Constants.LTI.Claims.ResourceLink]: { id: 'link_id' },
                    [Constants.AGS.Claims.Endpoint]: { lineitems: 'https://lineitems.com/lineitems' },
                    [Constants.NRPS.Claims.Endpoint]: {
                        context_memberships_url: 'https://memberships.com/memberships',
                        service_versions: ['2.0']
                    }
                }
            }
        };
    };

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

    const build_render = (view, options) => {
        return {
            render: (v, o) => {
                expect(v).to.equal(view);
                expect(o).to.deep.equal(options);
            }
        };
    };

    it('simple_link: returns error with no session', async () => {
        let req = { session: {} };
        let res = build_error(401, 'session not found');

        await links.simple_link(req, res);
    });

    it('simple_link: renders with session', async () => {
        let req = build_req();
        let res = build_render('simple_launch.pug');

        await links.simple_link(req, res);
    });

    it('lineitem_form: returns error with no session', async () => {
        let req = { session: {} };
        let res = build_error(401, 'session not found');

        await links.lineitem_form(req, res);
    });

    it('lineitem_form: returns error with no resource link', async () => {
        let req = { session: { client_id: 'cid', launch_token: {} } };
        let res = build_error(400, 'missing lti-ags resource link claim');

        await links.lineitem_form(req, res);
    });

    it('lineitem_form: returns error with no endpoint', async () => {
        let req = {
            body: {
                max_score: '1',
                label: 'label',
                tag: 'tag',
                resource_id: 'id'
            },
            session: {
                client_id: 'cid',
                launch_token: {
                    [Constants.LTI.Claims.ResourceLink]: { id: 'id' }
                }
            }
        };
        let res = build_error(400, 'missing lti-ags endpoint claim');

        await links.lineitem_form(req, res);
    });

    it('lineitem_form: returns error if failed to fetch access token', async () => {
        sinon.stub(utility, 'get_token').rejects(new Error('failure fetching token'));

        let req = build_req();
        let res = build_error(400, 'failure fetching token');

        await links.lineitem_form(req, res);
    });

    it('lineitem_form: returns error if failed to fetch lineitems', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(404, {});

        let req = build_req();
        let res = build_error(400, '404 - {}');

        await links.lineitem_form(req, res);
    });

    it('lineitem_form: posts lineitem if none returned', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(200, []);

        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .post('/lineitems', {
                scoreMaximum: '1',
                label: 'label',
                tag: 'tag',
                resourceId: 'id',
                resourceLinkId: 'link_id',
                submission: {
                    startDateTime: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
                    endDateTime: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
                }
            })
            .reply(200);

        let req = build_req();
        let res = build_render('simple_launch.pug');

        await links.lineitem_form(req, res);
    });

    it('lineitem_form: puts lineitem if some returned', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(200, [{
                id: 'https://lineitems.com/lineitems/lineitem_id'
            }]);

        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .put('/lineitems/lineitem_id', {
                scoreMaximum: '1',
                label: 'label',
                tag: 'tag',
                resourceId: 'id',
                resourceLinkId: 'link_id',
                submission: {
                    startDateTime: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
                    endDateTime: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
                }
            })
            .reply(200);

        let req = build_req();
        let res = build_render('simple_launch.pug');

        await links.lineitem_form(req, res);
    });

    it('lineitem_link: returns error with no session', async () => {
        let req = { session: {} };
        let res = build_error(401, 'session not found');

        await links.lineitem_link(req, res);
    });

    it('lineitem_link: renders with session', async () => {
        let req = build_req();
        let res = build_render('lineitem_launch.pug', { action: 'lineitem_form' });

        await links.lineitem_link(req, res);
    });

    it('lineitemscore_form: returns error with no session', async () => {
        let req = { session: {} };
        let res = build_error(401, 'session not found');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_form: returns error with no endpoint', async () => {
        let req = {
            body: { score_given: '2', score_maximum: '4', comment: 'comment' },
            session: { client_id: 'cid', launch_token: {} }
        };
        let res = build_error(400, 'missing lti-ags endpoint claim');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_form: returns error if failed to fetch access token', async () => {
        sinon.stub(utility, 'get_token').rejects(new Error('failure fetching token'));

        let req = build_req();
        let res = build_error(400, 'failure fetching token');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_form: returns error if failed to fetch lineitems', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(404, {});

        let req = build_req();
        let res = build_error(400, '404 - {}');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_form: returns error if failed post lineitem score', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(200, [{
                id: 'https://lineitems.com/lineitems/lineitem_id'
            }]);
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .post('/lineitems/lineitem_id/scores', {
                scoreGiven: '2',
                scoreMaximum: '4',
                comment: 'comment',
                timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
                activityProgress: 'Completed',
                gradingProgress: 'FullyGraded'
            })
            .reply(400, {});

        let req = build_req();
        let res = build_error(400, '400 - {}');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_form: returns error if failed to get results', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(200, [{
                id: 'https://lineitems.com/lineitems/lineitem_id'
            }]);
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .post('/lineitems/lineitem_id/scores', {
                scoreGiven: '2',
                scoreMaximum: '4',
                comment: 'comment',
                timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
                activityProgress: 'Completed',
                gradingProgress: 'FullyGraded'
            })
            .reply(200);
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems/lineitem_id/results')
            .reply(400, {});

        let req = build_req();
        let res = build_error(400, '400 - {}');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_form: returns error if failed to get result', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(200, [{
                id: 'https://lineitems.com/lineitems/lineitem_id'
            }]);
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .post('/lineitems/lineitem_id/scores', {
                scoreGiven: '2',
                scoreMaximum: '4',
                comment: 'comment',
                timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
                activityProgress: 'Completed',
                gradingProgress: 'FullyGraded'
            })
            .reply(200);
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems/lineitem_id/results')
            .reply(200, {
                results: [{
                    id: 'https://lineitems.com/lineitems/lineitem_id/results/result_id'
                }]
            });
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems/lineitem_id/results/result_id')
            .reply(400, {});

        let req = build_req();
        let res = build_error(400, '400 - {}');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_form: renders on success', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems')
            .query({ resource_id: 'id' })
            .reply(200, [{
                id: 'https://lineitems.com/lineitems/lineitem_id'
            }]);
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .post('/lineitems/lineitem_id/scores', {
                scoreGiven: '2',
                scoreMaximum: '4',
                comment: 'comment',
                timestamp: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
                activityProgress: 'Completed',
                gradingProgress: 'FullyGraded'
            })
            .reply(200);
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems/lineitem_id/results')
            .reply(200, {
                results: [{
                    id: 'https://lineitems.com/lineitems/lineitem_id/results/result_id'
                }]
            });
        nock('https://lineitems.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/lineitems/lineitem_id/results/result_id')
            .reply(200, {
                results: [{
                    id: 'https://lineitems.com/lineitems/lineitem_id/results/result_id'
                }]
            });

        let req = build_req();
        let res = build_render('simple_launch.pug');

        await links.lineitemscore_form(req, res);
    });

    it('lineitemscore_link: returns error with no session', async () => {
        let req = { session: {} };
        let res = build_error(401, 'session not found');

        await links.lineitemscore_link(req, res);
    });

    it('lineitemscore_link: renders with session', async () => {
        let req = build_req();
        let res = build_render('lineitemscore_launch.pug', { action: 'lineitemscore_form' });

        await links.lineitemscore_link(req, res);
    });

    it('nrps_link: returns error with no session', async () => {
        let req = { session: {} };
        let res = build_error(401, 'session not found');

        await links.nrps_link(req, res);
    });

    it('nrps_link: returns error with no endpoint claim', async () => {
        let req = {
            session: {
                client_id: 'cid',
                launch_token: {}
            }
        };
        let res = build_error(400, 'missing lti-nrps endpoint claim');

        await links.nrps_link(req, res);
    });

    it('nrps_link: returns error with no context_memberships_url', async () => {
        let req = {
            session: {
                client_id: 'cid',
                launch_token: {
                    [Constants.NRPS.Claims.Endpoint]: {}
                }
            }
        };
        let res = build_error(400, 'missing context_memberships_url');

        await links.nrps_link(req, res);
    });

    it('nrps_link: returns error with invalid service_versions', async () => {
        let req = {
            session: {
                client_id: 'cid',
                launch_token: {
                    [Constants.NRPS.Claims.Endpoint]: {
                        context_memberships_url: 'https://memberships.com/memberships'
                    }
                }
            }
        };
        let res = build_error(400, 'platform does not declare support for service_versions 2.0');

        await links.nrps_link(req, res);
    });

    it('nrps_link: returns error with missing resource link', async () => {
        let req = {
            session: {
                client_id: 'cid',
                launch_token: {
                    [Constants.NRPS.Claims.Endpoint]: {
                        context_memberships_url: 'https://memberships.com/memberships',
                        service_versions: ['2.0']
                    }
                }
            }
        };
        let res = build_error(400, 'missing lti resource link claim');

        await links.nrps_link(req, res);
    });

    it('nrps_link: returns error if failed to fetch access token', async () => {
        sinon.stub(utility, 'get_token').rejects(new Error('failure fetching token'));

        let req = build_req();
        let res = build_error(400, 'failure fetching token');

        await links.nrps_link(req, res);
    });

    it('nrps_link: returns error if failed to get memberships', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://memberships.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/memberships')
            .query({ rlid: 'link_id' })
            .reply(404, {});

        let req = build_req();
        let res = build_error(400, '404 - {}');

        await links.nrps_link(req, res);
    });

    it('nrps_link: renders with session', async () => {
        sinon.stub(utility, 'get_token').returns('token');
        nock('https://memberships.com')
            .matchHeader('authorization', 'Bearer token')
            .get('/memberships')
            .query({ rlid: 'link_id' })
            .reply(200, {
                id: 'https://memberships.com/memberships?rlid=link_id'
            });

        let req = build_req();
        let res = {
            send: (d) => {
                expect(d).to.deep.equal({ id: 'https://memberships.com/memberships?rlid=link_id' });
            }
        };

        await links.nrps_link(req, res);
    });
});
