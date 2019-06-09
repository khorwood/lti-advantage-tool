'use strict';
const express = require('express');
const router = express.Router();

const controller = require('../controllers/links');

router.get('/simple', controller.simple_link);

module.exports = router;
