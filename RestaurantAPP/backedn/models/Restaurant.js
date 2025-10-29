const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const restaurantSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tables: [{
        size: {
            type: Number,
            required: true
        },
        count: {
            type: Number,
            required: true
        }
    }],
    availableTables: [{
        size: {
            type: Number,
            required: true
        },
        count: {
            type: Number,
            required: true
        }
    }],
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    ratingCount: {
        type: Number,
        required: true,
        default: 0
    },
    images: {
        type: [String],
        required: true
    },
    menu: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    ratings: [{
        type: Schema.Types.ObjectId,
        ref: 'Rating'
    }],
    category: {
        type: String,
        required: true
    },
    priceRange: {
        type: String,
        required: true,
        enum: ['$', '$$', '$$$', '$$$$']
    },
    location: {
        type: String,
        required: true
    },
    cuisine: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
