const config = require('config');
const mongoose = require('mongoose');

const alboSchema = new mongoose.Schema({
    numero:  Number,
    title: String,
    autore: String,
    data: String,
    sinossi: String,
    urlCover: String
});

const Albo = mongoose.model('Albo', alboSchema);

function validateAlbo(albo) {
    // const schema = {
    //   name: Joi.string().min(5).max(50).required(),
    //   email: Joi.string().min(5).max(255).required().email(),
    //   password: Joi.string().min(5).max(255).required()
    // };

    // return Joi.validate(albo, schema);
}

exports.Albo = Albo;
// exports.validate = validateAlbo;