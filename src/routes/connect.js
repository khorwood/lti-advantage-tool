'use strict';

const express = require('express');
const ConnectController = require('../controllers/connect');

module.exports = uuid => {
    const controller = new ConnectController(uuid);

    const router = express.Router();
    router.get('/', controller.connect);
    router.post('/', controller.connect);

    return router;
};
