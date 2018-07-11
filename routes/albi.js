const _ = require('lodash');
const { Albo } = require('../models/albo');
const { User } = require('../models/user');
const { Relation } = require('../models/relation');
const mongoose = require('mongoose');
const express = require('express');
const cloudinary = require('cloudinary');
const cheerio = require('cheerio')
const router = express.Router();

cloudinary.config({
    cloud_name: 'hxhune77r',
    api_key: '363153635214738',
    api_secret: 'v8Qnt9oaACok0qK27iNqedHBv0o'
});

/**
 * GetAlbi
 */
router.get('/list/:email/:lastAlboNumero/:filter', async (req, res) => {

    const user = await User.findOne({ email: req.params.email });

    const lastAlboNumero = req.params.lastAlboNumero;

    let filter = req.params.filter;

    if(filter == 'null')
        filter = '';

    let matcher = {};

    if(lastAlboNumero == 0) {
        matcher = {
            $or: [
                    { title: { $regex: filter, $options: 'xi' } },
                    { numero : { $eq: filter } }
                 ]
        };
    } else
        matcher = { numero : { $gt:  parseInt(lastAlboNumero) } }

    /**
     * When a $sort immediately precedes a $limit in the pipeline,
     * the $sort operation only maintains the top n results as it progresses,
     * where n is the specified limit, and MongoDB only needs to store n items in memory.
     * This optimization still applies when allowDiskUse is true and the n items exceed the aggregation memory limit.
     */
    const albi = await Albo.aggregate([
        { $match: matcher },
        { $lookup: { from: "relations", localField: "_id", foreignField: "alboId", as: "status" } },
        { $sort : { numero : 1 }  },
        { $limit: 10  },
        {
          $project: {
                numero: 1,
                title: 1,
                status: {
                    $filter: {
                        input: "$status",
                        as: "rel",
                        cond: {
                            $eq: [ "$$rel.userId", user._id ]
                        }
                    }
                },
                stato: "$status.status"
            },
        },
        { "$unwind": "$status" },
        { "$unwind": "$stato" }
    ]);
    console.log(albi[1]);
    res.send(albi);
});

/**
 * GetAlbo
 */
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
                autore: 1,
                urlCover: 1,
                status: {
                    $filter: {
                        input: "$status",
                        as: "rel",
                        cond: {
                            $eq: [ "$$rel.userId", user._id ]
                        }
                    }
                },
                stato: "$status.status"
            },
        },
        { "$unwind": "$status" },
        // { "$unwind": "$stato" }
    ]);

    const htmlImg = cloudinary.image(`UraniaVault/u${albo[0].numero}.jpg`);
    const url = cheerio.load(htmlImg)('img').attr('src');
    albo[0].urlCover = url;

    albo[0].status = albo[0].status.status === 'NaN' ? '0' : albo[0].status.status;

    console.log(albo[0]);

    res.send(albo[0]);
});

/**
 * Aggiorna Albo
 */
router.put('/albo/:email/:idAlbo/:stato', async (req, res) => {
    console.log('inside patch albo');

    const user = await User.findOne({ email: req.params.email });

    const alboIdObejct = mongoose.Types.ObjectId(req.params.idAlbo);

    const relation = await Relation.findOne({ userId: user._id, alboId: alboIdObejct });

    relation.status = req.params.stato;

    relation.save();

    res.send({ stato : relation.status });
});

/**
 * Inizializza Catalogo Cliente
 */
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

/**
 * Update Catalogo Cliente
 */
router.post('/update', async (req, res) => {
    if (!req.body.email)
      return res.status(400).send(error.details[0].message);

    const ultimoAlboCatalogo = await Albo.findOne({}).sort('-numero');
    const ultimoAlboUserExists = await Relation.count({ alboId: ultimoAlboCatalogo._id }) > 0;

    if(ultimoAlboUserExists)
        return res.send();

    Relation.create(ultimoAlboCatalogo);

    return res.send();
});

/**
 * Controllo Primo Accesso Cliente
 */
router.get('/isFirstAccess/:email', async (req, res) => {
    let user = await User.findOne({ email: req.params.email });
    const count = await Relation.count({userId : user._id});
    return res.send({count: count});
});

/**
 * Cancella Collezione Cliente
 */
router.delete('/deleteCollectionAlbi', async (req, res) => {
    await Relation.remove();
    return res.send();
});

module.exports = router;