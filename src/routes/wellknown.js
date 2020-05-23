'use strict';

const express = require('express');
const WellknownController = require('../controllers/wellknown');

module.exports = jose => {
    const controller = new WellknownController(jose);

    const router = express.Router();
    router.get('/jwks.json', controller.jwks);

    return router;
};
