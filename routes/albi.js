const _ = require('lodash');
const { Albo } = require('../models/albo');
const { User } = require('../models/user');
const { Relation } = require('../models/relation');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/list/:email/:countAlbiLoaded/:filter', async (req, res) => {

    const user = await User.findOne({ email: req.params.email });

    const countAlbiLoaded = parseInt(req.params.countAlbiLoaded);

    let filter = parseInt(req.params.filter);

    /**
     * When a $sort immediately precedes a $limit in the pipeline,
     * the $sort operation only maintains the top n results as it progresses,
     * where n is the specified limit, and MongoDB only needs to store n items in memory.
     * This optimization still applies when allowDiskUse is true and the n items exceed the aggregation memory limit.
     */
    const albi = await Albo.aggregate([
        {
            $match: {
                numero : {
                    // $gt:  countAlbiLoaded
                    $eq: filter
                }
            }
        },
        {   $lookup: { from: "relations", localField: "_id", foreignField: "alboId", as: "status" } },
        {   $sort : { numero : 1 }  },
        {   $limit: 10  },
        {
            $project: {
                numero: 1,
                title: 1,
                status: { $filter: { input: "$status", as: "rel", cond: { $eq: [ "$$rel.userId", user._id ] } } }
            },
        },
        // { "$unwind": "$status" } // usare questo, però prima devo creare un init sulla relation per auopoppolarla
    ]);

    res.send(albi);
});

router.get('/albo/:email/:numero', async (req, res) => {
    if (!req.params.email)
        return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ email: req.params.email });

    const albo = await Albo.aggregate([
        {
            $match: {
                numero : {
                    $eq: parseInt(req.params.numero)
                }
            }
        },
        {   $lookup: { from: "relations", localField: "_id", foreignField: "alboId", as: "status" } },
        {   $limit: 1  },
        {
            $project: {
                numero: 1,
                title: 1,
                status: { $filter: { input: "$status", as: "rel", cond: { $eq: [ "$$rel.userId", user._id ] } } }
            },
        },
        // { "$unwind": "$status" } // usare questo, però prima devo creare un init sulla relation per auopoppolarla
    ]);

    console.log(albo);
    console.log(albo[0]);

    res.send(albo[0]);
});

router.put('/albo/:email/:idAlbo/:stato', async (req, res) => {
    console.log('inside patch albo');

    const user = await User.findOne({ email: req.params.email });

    console.log(req.params.email);
    console.log(req.params.idAlbo);
    console.log(req.params.stato);

    const alboIdObejct = mongoose.Types.ObjectId(req.params.idAlbo);

    const relation = await Relation.findOne({ userId: user._id, alboId: alboIdObejct });

    relation.status = req.params.stato;

    relation.save();

    res.send();
});

router.post('/init', async (req, res) => {

    if (!req.body.email)
      return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });

    const albi = await Albo.find();

    let insertBulk = [];

    for (var i = 0, len = albi.length; i < len; i++) {
        const relation = new Relation({
            alboId: albi[i]._id,
            userId: user._id,
            status: 0
        });
        insertBulk.push(relation);
    }

    Relation.insertMany(insertBulk);

    res.send();
});

router.post('/update', async (req, res) => {
    if (!req.body.email)
      return res.status(400).send(error.details[0].message);

    const ultimoAlboCatalogo = await Albo.findOne({}).sort('-numero');
    const ultimoAlboUserExists = await Relation.count({ alboId: ultimoAlboCatalogo._id }) > 0;

    console.log(ultimoAlboCatalogo);
    console.log(ultimoAlboUserExists);

    if(ultimoAlboUserExists)
        return res.send();

    Relation.create(ultimoAlboCatalogo);

    return res.send();
});

router.get('/isFirstAccess/:email', async (req, res) => {
    let user = await User.findOne({ email: req.params.email });
    const count = await Relation.count({userId : user._id});
    return res.send({count: count});
});

router.delete('/deleteCollectionAlbi', async (req, res) => {
    await Relation.remove();
    return res.send();
});

module.exports = router;