'use strict';

const express = require('express');
const app = express();
const port = 3000;

const JOSE = require('./jose');
const jose = new JOSE();

app.get('/.well-known/jwks.json', async (req, res) => await jose.getJwks(req, res));

app.listen(port, () => console.log(`Listening: ${port}`));
