/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

const mongoose = require("mongoose");

const ResSchema = new mongoose.Schema(
    {
        "league": String,
        "team": String,
        "stadium": {
            type: String,
            required: true
        },
        "stadium latitude": Number,
        "stadium longitude": Number,
        "radius": String,
        "city": {
            type: String,
            required: true,
            trim: true
        },
        "state": {
            type: String,
            required: true,
            trim: true
        },
        "businesses": Array,
        "absolute total": Number,
        "total": Number
    }
);

module.exports = mongoose.model("Restaurant", ResSchema);