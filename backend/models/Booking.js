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

// Indexes to optimize frequent queries
// - Listing a member's bookings sorted by createdAt
bookingSchema.index({ member: 1, createdAt: -1 });
// - Trainer calendar and by-date lookups (prefix regex on date benefits from (trainer, date))
bookingSchema.index({ trainer: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
