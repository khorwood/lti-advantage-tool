'use strict';

const port = 3000;

const debug = require('debug')('lti-advantage-tool');
const express = require('express');
const express_session = require('express-session');
const fs = require('fs');
const https = require('https');

const config = require('../config.json');
const jose = require('./jose');
jose.init(config.platform_configs);

const app = express();

const authenticate_router = require('./routes/authenticate');
const connect_router = require('./routes/connect');
const links_router = require('./routes/links');
const wellknown_router = require('./routes/wellknown');

app.set('config', config);
app.use(express_session({
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

app.use('/.well-known', wellknown_router);
app.use('/authenticate', authenticate_router);
app.use('/connect', connect_router);
app.use('/links', links_router);
app.use('/images', express.static('images'));

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app)
    .listen(port, () => {
        debug(`Listening: ${port}`);
    });
