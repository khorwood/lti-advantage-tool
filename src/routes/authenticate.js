'use strict';

const express = require('express');
const AuthenticateController = require('../controllers/authenticate');

module.exports = jose => {
    const controller = new AuthenticateController(jose);

    const router = express.Router();
    router.post('/', controller.authenticate);

    return router;
};
