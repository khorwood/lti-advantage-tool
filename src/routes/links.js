'use strict';

const express = require('express');
const router = express.Router();

const controller = require('../controllers/links');

router.get('/simple', controller.simple_link);
router.get('/lineitem', controller.lineitem_link);
router.post('/lineitem_form', controller.lineitem_form);
router.get('/lineitemscore', controller.lineitemscore_link);
router.post('/lineitemscore_form', controller.lineitemscore_form);

module.exports = router;
