const config = require('config');
const mongoose = require('mongoose');

const relationSchema = new mongoose.Schema({
    alboId: mongoose.Schema.ObjectId,
    userId: mongoose.Schema.ObjectId,
    status: String
});

relationSchema.index({ alboId: 1, userId:1, status: 1 });

const Relation = mongoose.model('Relation', relationSchema);

exports.Relation = Relation;