'use strict';

const express = require('express');
const router = express.Router();

const controller = require('../controllers/connect');

router.get('/', controller.connect);
router.post('/', controller.connect);

module.exports = router;
