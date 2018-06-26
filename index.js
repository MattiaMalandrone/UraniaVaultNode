const winston = require('winston');
const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors());
app.options('*', cors())

require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();
require('./startup/validation')();

const port = process.env.PORT || 5000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;