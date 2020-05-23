'use strict';

const express = require('express');
const LinksController = require('../controllers/links');

module.exports = utility => {
    const controller = new LinksController(utility);

    const router = express.Router();
    router.get('/simple', controller.simpleLink);
    router.get('/lineitem', controller.lineItemLink);
    router.post('/lineitem_form', controller.lineItemForm);
    router.get('/lineitemscore', controller.lineItemScoreLink);
    router.post('/lineitemscore_form', controller.lineItemScoreForm);
    router.get('/nrpslink', controller.nrpsLink);

    return router;
};
