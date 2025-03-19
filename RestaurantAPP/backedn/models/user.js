const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definicja schematu użytkownika
const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        enum: ['customer', 'manager', 'admin'],
        default: 'customer'
    },
    phone: {
        type: String,
        required: false
    },
    address: {
        street: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        zip: { type: String, required: false }
    },
    avatar: {
        type: String,
        default: 'https://i.postimg.cc/13H04n4n/default.webp'
    },
    ratings: [{
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: false }
    }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
