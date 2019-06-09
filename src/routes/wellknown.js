'use strict';
const express = require('express');
const router = express.Router();

const controller = require('../controllers/wellknown');

router.get('/jwks.json', controller.jwks);
router.post('/jwks.json', controller.jwks);

module.exports = router;
