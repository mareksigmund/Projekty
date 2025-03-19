// models/avatar.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definicja schematu awatara
const avatarSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    }
}, { timestamps: true });

const Avatar = mongoose.model('Avatar', avatarSchema);

module.exports = Avatar;
