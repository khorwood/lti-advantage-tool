'use strict';

const debug = require('debug')('lti-advantage-tool:controllers')

module.exports.simple_link = async (req,res) => {
    debug('simple_link');

    if (!req.session.client_id) { return res.status(401).send('session not found'); }

    res.render('simple_launch.pug');
};
