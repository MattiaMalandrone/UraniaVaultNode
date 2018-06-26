const _ = require('lodash');
const { Albo } = require('../models/albo');
const { Relation } = require('../models/relation');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/list', async (req, res) => {

    const userId = mongoose.Types.ObjectId("5b2a67073762f42e3c51d1b5");

    const albi = await Albo.aggregate([
        {
            $lookup: {
                from: "relations",
                localField: "_id",
                foreignField: "alboId",
                as: "status"
            }
        },
        {
            $project:
            {
                numero: 1,
                title: 1,
                status:
                {
                    $filter:
                    {
                        input: "$status",
                        as: "rel",
                        cond: { $eq: [ "$$rel.userId", userId ] }
                    }
                }
            },
        },
        // { "$unwind": "$status" } // usare questo, però prima devo creare un unit sulla relation per auopoppolarla
    ]).limit(10);

    console.log(albi)

    res.send(albi);
});

router.post('/init', async (req, res) => {
    const { error } = validate(req.body);

    if (error)
      return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ email: req.body.email });

    console.log(user._id);

    res.send();
});

module.exports = router;