'use strict';

const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const port = 3000;

//const cookieParser = require('cookie-parser');
const session = require('express-session');

const configs = require('../config.json');

const JOSE = require('./jose');
const jose = new JOSE(configs.platform_configs);

const Launch = require('./launch');
const launch = new Launch(jose, configs.platform_configs);

app.use(session({
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

app.get('/.well-known/jwks.json', async (req, res) => await jose.get_jwks(req, res));

app.get('/connect', async (req, res) => await launch.connect(req, res));
app.post('/connect', async (req, res) => await launch.connect(req, res));

app.post('/authenticate', async (req, res) => await launch.authenticate(req, res));

app.get('/simple_link', async (req, res) => await launch.simple_link(req, res));

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app)
    .listen(port, () => {
        console.log(`Listening: ${port}`)
    });
