'use strict';

const debug = require('debug')('lti-advantage-tool:controllers:links');
const request = require('request-promise-native');

const Constants = require('../constants');
const utility = require('../utility');

const simple_link = async (req, res) => {
    debug('simple_link');

    const launch_token = req.session && req.session.launch_token;
    if (!launch_token) {
        return res.status(401).send('session not found');
    }

    res.render('simple_launch.pug');
};

const lineitem_link = async (req, res) => {
    debug('lineitem_link');

    const launch_token = req.session && req.session.launch_token;
    if (!launch_token) {
        return res.status(401).send('session not found');
    }

    res.render('lineitem_launch.pug', { action: 'lineitem_form' });
};

const lineitemscore_link = async (req, res) => {
    debug('lineitemscore_link');

    const launch_token = req.session && req.session.launch_token;
    if (!launch_token) {
        return res.status(401).send('session not found');
    }

    res.render('lineitemscore_launch.pug', { action: 'lineitemscore_form' });
};

const lineitem_form = async (req, res) => {
    debug('lineitem_form');

    try {
        const launch_token = req.session && req.session.launch_token;
        if (!launch_token) {
            return res.status(401).send('session not found');
        }

        const resource_link_claim = launch_token[Constants.LTI.Claims.ResourceLink];
        if (!resource_link_claim) { throw new Error('missing lti-ags resource link claim'); }

        const resource_link_id = resource_link_claim.id;

        if (!req.body.max_score) { throw new Error('missing max_score'); }
        if (!req.body.label) { throw new Error('missing label'); }
        if (!req.body.tag) { throw new Error('missing tag'); }
        if (!req.body.resource_id) { throw new Error('missing resource_id'); }

        var payload = {
            scoreMaximum: req.body.max_score,
            label: req.body.label,
            tag: req.body.tag,
            resourceId: req.body.resource_id,
            resourceLinkId: resource_link_id,
            submission: {
                startDateTime: new Date().toISOString(),
                endDateTime: new Date().toISOString()
            }
        };

        const endpoint_claim = req.session.launch_token[Constants.AGS.Claims.Endpoint];
        if (!endpoint_claim) { throw new Error('missing lti-ags endpoint claim'); }

        const lineitems_endpoint = endpoint_claim.lineitems;
        if (!lineitems_endpoint) { throw new Error('missing endpoint lineitems'); }

        const access_token = await utility.get_token(req);

        let lineitems = await request.get({
            uri: lineitems_endpoint,
            headers: { authorization: `Bearer ${access_token}` },
            qs: { resource_id: req.body.resource_id },
            json: true
        });

        if (!lineitems.length) {
            let response = await request.post({
                uri: lineitems_endpoint,
                body: payload,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            debug(response);
        } else {
            let response = await request.put({
                uri: `${lineitems[0].id}`,
                body: payload,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            debug(response);
        }

        res.render('simple_launch.pug');
    } catch (e) {
        return res.status(400).send(e.message);
    }
};

const lineitemscore_form = async (req, res) => {
    debug('lineitemscore_form');

    try {
        const launch_token = req.session && req.session.launch_token;
        if (!launch_token) {
            return res.status(401).send('session not found');
        }

        if (!req.body.score_given) { throw new Error('missing score_given'); }
        if (!req.body.score_maximum) { throw new Error('missing score_maximum'); }
        if (!req.body.comment) { throw new Error('missing comment'); }

        const payload = {
            userId: launch_token['sub'],
            scoreGiven: req.body.score_given,
            scoreMaximum: req.body.score_maximum,
            comment: req.body.comment,
            timestamp: new Date().toISOString(),
            activityProgress: 'Completed',
            gradingProgress: 'FullyGraded'
        };

        const endpoint_claim = launch_token[Constants.AGS.Claims.Endpoint];
        if (!endpoint_claim) { throw new Error('missing lti-ags endpoint claim'); }

        const lineitems_endpoint = endpoint_claim.lineitems;
        if (!lineitems_endpoint) { throw new Error('missing endpoint lineitems'); }

        const access_token = await utility.get_token(req);

        const line_items = await request.get({
            uri: lineitems_endpoint,
            qs: { resource_id: req.body.resource_id },
            headers: { authorization: `Bearer ${access_token}` },
            json: true
        });

        debug(line_items);

        const line_item = line_items[0];

        if (line_item) {
            await request.post({
                uri: `${line_item.id}/scores`,
                body: payload,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            let result = await request.get({
                uri: `${line_item.id}/results`,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            debug(result);

            await request.get({
                uri: `${result.results[0].id}`,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });
        }

        res.render('simple_launch.pug');
    } catch (e) {
        return res.status(400).send(e.message);
    }
};

const nrps_validate_membership = (membership) => {
    if (!membership.context || !membership.context.id) { throw new Error('missing membership context id'); }
    if (!membership.members) { throw new Error('missing members'); }

    membership.members.map(m => {
        if (!m.user_id) { throw new Error('missing member user_id'); }
        if (!m.roles) { throw new Error('missing member roles'); }
    });
};

const nrps_link = async (req, res) => {
    debug('nrps_link');

    try {
        const launch_token = req.session && req.session.launch_token;
        if (!launch_token) {
            return res.status(401).send('session not found');
        }

        const endpoint_claim = launch_token[Constants.NRPS.Claims.Endpoint];
        if (!endpoint_claim) { throw new Error('missing lti-nrps endpoint claim'); }

        const nrps_endpoint = endpoint_claim.context_memberships_url;
        if (!nrps_endpoint) { throw new Error('missing context_memberships_url'); }

        const nrps_versions = endpoint_claim.service_versions;
        if (!nrps_versions || !nrps_versions.includes('2.0')) {
            throw new Error('platform does not declare support for service_versions 2.0');
        }

        const resource_link_claim = launch_token[Constants.LTI.Claims.ResourceLink];
        if (!resource_link_claim) { throw new Error('missing lti resource link claim'); }

        const resource_link_id = resource_link_claim.id;
        if (!resource_link_id) { throw new Error('missing resource_link id'); }

        const access_token = await utility.get_token(req);

        const membership = await request.get({
            uri: nrps_endpoint,
            qs: { rlid: resource_link_id },
            headers: { authorization: `Bearer ${access_token}` },
            json: true
        });

        debug(membership);

        nrps_validate_membership(membership);

        res.send(membership);
    } catch (e) {
        return res.status(400).send(e.message);
    }
};

module.exports = {
    simple_link,
    lineitem_form,
    lineitem_link,
    lineitemscore_link,
    lineitemscore_form,
    nrps_link
};
