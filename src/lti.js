'use strict';

class Lti {
    static get Claims() {
        return {
            DeploymentId: 'https://purl.imsglobal.org/spec/lti/claim/deployment_id'
        };
    }
}

module.exports = Lti;
