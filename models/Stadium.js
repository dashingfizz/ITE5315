/******************************************************************************
* ITE5315 – Project
* I declare that this project is my own work in accordance with Humber Academic Policy.
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* Group Member Names: Daniel Tarhembe, Jeffrey Lamptey, Nana Sackey
* Student IDs: n01719446, n01675664, n01700360
* Date: 2025-11-26
******************************************************************************/

const mongoose = require('mongoose');

const stadiumSchema = new mongoose.Schema({
    league: String,
    team: String,
    stadium: String,
    "stadium latitude": Number,
    "stadium longitude": Number,
    radius: String,
    city: String,
    state: String,
    businesses: [{
        id: String,
        alias: String,
        name: String,
        image_url: String,
        is_closed: Boolean,
        url: String,
        review_count: Number,
        categories: [{
            alias: String,
            title: String
        }],
        rating: Number,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        transactions: [String],
        price: String,
        location: {
            address1: String,
            address2: String,
            address3: String,
            city: String,
            zip_code: String,
            country: String,
            state: String,
            display_address: [String]
        },
        phone: String,
        display_phone: String,
        distance: Number
    }]
});

module.exports = mongoose.model('Stadium', stadiumSchema, 'resturants');