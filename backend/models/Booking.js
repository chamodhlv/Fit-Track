const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  // timeSlot is now optional since bookings are date-only
  timeSlot: {
    start: { type: String }, // HH:mm
    end: { type: String },   // HH:mm
  },
  location: { type: String, default: 'Fit-Track GYM' },
  amount: { type: Number, required: true }, // LKR amount to be paid at counter
  status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
