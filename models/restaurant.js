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