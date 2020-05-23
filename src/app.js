'use strict';

const port = 3000;

const debug = require('debug')('lti-advantage-tool');
const express = require('express');
const expressSession = require('express-session');
const fetch = require('node-fetch');
const fs = require('fs');
const https = require('https');
const uuid = require('uuid');

const config = require('../config.json');

const JOSE = require('./jose');
const jose = new JOSE(fetch);
jose.init(config.platform_configs);

const Utility = require('./utility');
const utility = new Utility(fetch, jose, uuid);

const app = express();

const authenticateFactory = require('./routes/authenticate');
const connectFactory = require('./routes/connect');
const linksFactory = require('./routes/links');
const wellknownFactory = require('./routes/wellknown');

app.set('config', config);
app.use(expressSession({
    cookie: {
        httpOnly: true,
        secure: true
    },
    resave: true,
    secret: 'session_key',
    saveUninitialized: false,
    unset: 'destroy'
}));
app.use(express.urlencoded({ extended: true }));

app.use('/.well-known', wellknownFactory(jose));
app.use('/authenticate', authenticateFactory(jose));
app.use('/connect', connectFactory(uuid));
app.use('/links', linksFactory(utility));
app.use('/images', express.static('images'));

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app)
    .listen(port, () => {
        debug(`Listening: ${port}`);
    });
