const Joi = require('joi');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {User} = require('../models/user');
const express = require('express');
const router = express.Router();

router.post('/signin', async (req, res) => {

  console.log('signin...');

  const { error } = validate(req.body);

  console.log(`ERROR signin`);

  if (error)
    return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });

  console.log(user);

  if (!user)
    return res.status(400).send('Invalid email or password.');

  const validPassword = await bcrypt.compare(req.body.password, user.password);

  console.log(validPassword);

  if (!validPassword)
    return res.status(400).send('Invalid email or password.');

  const token = user.generateAuthToken();

  console.log("token: ", token);
  console.log("userId: ", user._id);
  res.send({token: token, userId: user._id});
});

function validate(req) {
  console.log(req);
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(req, schema);
}

module.exports = router;
