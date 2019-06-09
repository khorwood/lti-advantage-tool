'use strict';

const debug = require('debug')('lti-advantage-tool:controllers:links');
const request = require('request-promise-native');

const Constants = require('../constants');
const utility = require('../utility');

const simple_link = async (req, res) => {
    debug('simple_link');

    if (!req.session.client_id) { return res.status(401).send('session not found'); }

    res.render('simple_launch.pug');
};

const lineitem_link = async (req, res) => {
    debug('lineitem_link');

    if (!req.session.client_id) { return res.status(401).send('session not found'); }

    res.render('lineitem_launch.pug', { action: 'lineitem_form' });
};

const lineitemscore_link = async (req, res) => {
    debug('lineitemscore_link');

    if (!req.session.client_id) { return res.status(401).send('session not found'); }

    res.render('lineitemscore_launch.pug', { action: 'lineitemscore_form' });
};

const lineitem_form = async (req, res) => {
    debug('lineitem_form');

    try {
        if (!req.session.client_id) { return res.status(401).send('session not found'); }

        const resource_link_claim = req.session.launch_token[Constants.LTI.Claims.ResourceLink];
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

        const access_token = await utility.get_token(req);

        let lineitems = await request.get({
            uri: lineitems_endpoint,
            headers: { authorization: `Bearer ${access_token}` },
            qs: {
                resource_id: req.body.resource_id
            },
            json: true
        });

        if (!lineitems.length) {
            let response = await request.post(
                lineitems_endpoint,
                {
                    uri: lineitems_endpoint,
                    body: payload,
                    headers: { authorization: `Bearer ${access_token}` },
                    json: true
                });

            debug(response);
        } else {
            let response = await request.put(
                `${lineitems[0].id}`,
                {
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
        if (!req.session.client_id) { return res.status(401).send('session not found'); }

        const sub = req.session.launch_token['sub'];

        if (!req.body.score_given) { throw new Error('missing score_given'); }
        if (!req.body.score_maximum) { throw new Error('missing score_maximum'); }
        if (!req.body.comment) { throw new Error('missing comment'); }

        let payload = {
            userId: sub,
            scoreGiven: req.body.score_given,
            scoreMaximum: req.body.score_maximum,
            comment: req.body.comment,
            timestamp: new Date().toISOString(),
            activityProgress: 'Completed',
            gradingProgress: 'FullyGraded'
        }

        const endpoint_claim = req.session.launch_token[Constants.AGS.Claims.Endpoint];
        if (!endpoint_claim) { throw new Error('missing lti-ags endpoint claim'); }

        const lineitems_endpoint = endpoint_claim.lineitems;

        const access_token = await utility.get_token(req);

        let line_items = await request.get({
            uri: lineitems_endpoint,
            qs: {
                resource_id: req.body.resource_id
            },
            headers: { authorization: `Bearer ${access_token}` },
            json: true
        });

        let line_item = line_items[0];

        if (line_item) {
            let response = await request.post(
                `${line_item.id}/scores`,
                {
                    body: payload,
                    headers: { authorization: `Bearer ${access_token}` },
                    json: true
                });

            response = await request.get({
                uri: `${line_item.id}/results`,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });

            response = await request.get({
                uri: `${response.results[0].id}`,
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            });
        }

        res.render('simple_launch.pug');
    } catch (e) {
        return res.status(400).send(e.message);
    }
};

module.exports = {
    simple_link,
    lineitem_form,
    lineitem_link,
    lineitemscore_link,
    lineitemscore_form
};
