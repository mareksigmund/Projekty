const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    seats: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending' }
}, { timestamps: true });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
