'use strict';

const constants = require('../constants');

class LinksController {
    constructor(utility) {
        this._debug = require('debug')('lti-advantage-tool:controllers:links');
        this._utility = utility;
    }

    simpleLink(request, response) {
        this._debug('simple_link');

        if (!request.session.client_id) {
            return response.status(401).send('session not found');
        }

        response.render('simple_launch.pug');
    }

    lineItemLink(request, response) {
        this._debug('lineitem_link');

        if (!request.session.client_id) {
            return response.status(401).send('session not found');
        }

        response.render('lineitem_launch.pug', { action: 'lineitem_form' });
    }

    lineItemScoreLink(request, response) {
        this._debug('lineitemscore_link');

        if (!request.session.client_id) {
            return response.status(401).send('session not found');
        }

        response.render('lineitemscore_launch.pug', { action: 'lineitemscore_form' });
    }

    async lineItemForm(request, response) {
        this._debug('lineitem_form');

        try {
            if (!request.session.client_id) {
                return response.status(401).send('session not found');
            }

            const resourceLinkClaim = request.session.launch_token[constants.LTI.Claims.ResourceLink];
            if (!resourceLinkClaim) {
                throw new Error('missing lti-ags resource link claim');
            }

            const resourceLinkId = resourceLinkClaim.id;

            if (!request.body.max_score) {
                throw new Error('missing max_score');
            }

            if (!request.body.label) {
                throw new Error('missing label');
            }

            if (!request.body.tag) {
                throw new Error('missing tag');
            }

            if (!request.body.resource_id) {
                throw new Error('missing resource_id');
            }

            const payload = {
                scoreMaximum: request.body.max_score,
                label: request.body.label,
                tag: request.body.tag,
                resourceId: request.body.resource_id,
                resourceLinkId,
                submission: {
                    startDateTime: new Date().toISOString(),
                    endDateTime: new Date().toISOString()
                }
            };

            const endpointClaim = request.session.launch_token[constants.AGS.Claims.Endpoint];
            if (!endpointClaim) {
                throw new Error('missing lti-ags endpoint claim');
            }

            const lineItemsEndpoint = endpointClaim.lineitems;

            const accessToken = await this._utility.getToken(request);

            const lineitems = await this._utility.fetch(
                lineItemsEndpoint,
                {
                    headers: {
                        authorization: `Bearer ${accessToken}`
                    }
                },
                {
                    resource_id: request.body.resource_id
                });
            if (lineitems.length === 0) {
                const lineitem = await this._utility.fetch(
                    lineItemsEndpoint,
                    {
                        method: 'post',
                        body: JSON.stringify(payload),
                        headers: {
                            authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                this._debug(lineitem);
            } else {
                const lineitem = await this._utility.fetch(
                    `${lineitems[0].id}`,
                    {
                        method: 'put',
                        body: JSON.stringify(payload),
                        headers: {
                            authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                this._debug(lineitem);
            }

            response.render('simple_launch.pug');
        } catch (error) {
            return response.status(400).send(error.message);
        }
    }

    async lineItemScoreForm(request, response) {
        this._debug('lineitemscore_form');

        try {
            if (!request.session.client_id) {
                return response.status(401).send('session not found');
            }

            const sub = request.session.launch_token.sub;

            if (!request.body.score_given) {
                throw new Error('missing score_given');
            }

            if (!request.body.score_maximum) {
                throw new Error('missing score_maximum');
            }

            if (!request.body.comment) {
                throw new Error('missing comment');
            }

            const payload = {
                userId: sub,
                scoreGiven: request.body.score_given,
                scoreMaximum: request.body.score_maximum,
                comment: request.body.comment,
                timestamp: new Date().toISOString(),
                activityProgress: 'Completed',
                gradingProgress: 'FullyGraded'
            };

            const endpointClaim = request.session.launch_token[constants.AGS.Claims.Endpoint];
            if (!endpointClaim) {
                throw new Error('missing lti-ags endpoint claim');
            }

            const lineitemsEndpoint = endpointClaim.lineitems;

            const accessToken = await this._utility.getToken(request);

            const lineItems = await this._utility.fetch(
                lineitemsEndpoint,
                {
                    headers: {
                        authorization: `Bearer ${accessToken}`
                    }
                },
                {
                    resource_id: request.body.resource_id
                });

            const lineItem = lineItems[0];
            if (lineItem) {
                await this._utility.fetch(
                    `${lineItem.id}/scores`,
                    {
                        method: 'post',
                        body: JSON.stringify(payload),
                        headers: {
                            authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                const result = await this._utility.fetch(
                    `${lineItem.id}/results`,
                    {
                        headers: {
                            authorization: `Bearer ${accessToken}`
                        }
                    });

                await this._utility.fetch(
                    `${result.results[0].id}`,
                    {
                        headers: {
                            authorization: `Bearer ${accessToken}`
                        }
                    });
            }

            response.render('simple_launch.pug');
        } catch (error) {
            return response.status(400).send(error.message);
        }
    }

    async nrpsLink(request, response) {
        this._debug('nrps_link');

        try {
            if (!request.session.client_id) {
                return response.status(401).send('session not found');
            }

            const endpointClaim = request.session.launch_token[constants.NRPS.Claims.Endpoint];
            if (!endpointClaim) {
                throw new Error('missing lti-nrps endpoint claim');
            }

            const nrpsEndpoint = endpointClaim.context_memberships_url;
            if (!nrpsEndpoint) {
                throw new Error('missing context_memberships_url');
            }

            const nrpsVersions = endpointClaim.service_versions;
            if (!nrpsVersions || !nrpsVersions.includes('2.0')) {
                throw new Error('platform does not declare support for service_versions 2.0');
            }

            const resourceLinkClaim = request.session.launch_token[constants.LTI.Claims.ResourceLink];
            if (!resourceLinkClaim) {
                throw new Error('missing lti resource link claim');
            }

            const resourceLinkId = resourceLinkClaim.id;

            const accessToken = await this._utility.getToken(request);

            const memberships = await this._utility.fetch(
                nrpsEndpoint,
                {
                    headers: {
                        authorization: `Bearer ${accessToken}`
                    }
                },
                {
                    rlid: resourceLinkId
                });

            this._debug(memberships);

            response.send(memberships);
        } catch (error) {
            return response.status(400).send(error.message);
        }
    }
}

module.exports = LinksController;
