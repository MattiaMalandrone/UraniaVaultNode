const express = require('express');
const users = require('../routes/users');
const albi = require('../routes/albi');
const auth = require('../routes/auth');
const error = require('../middleware/error');

module.exports = function(app) {
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/api/albi', albi);
  app.use('/api/auth', auth);
  app.use(error);
}