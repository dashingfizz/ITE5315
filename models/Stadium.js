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