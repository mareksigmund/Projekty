const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ratingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: false }
}, { timestamps: true });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;



    



