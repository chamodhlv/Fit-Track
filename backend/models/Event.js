const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  qualification: { type: String, required: true, trim: true },
}, { _id: false });

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  time: { type: String, required: true, trim: true }, // time in HH:MM format
  guests: { type: [GuestSchema], default: [] },
  description: { type: String, required: true },
  image: { type: String }, // base64 image or URL
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual or helper for attendee count
EventSchema.virtual('attendeeCount').get(function () {
  return this.attendees?.length || 0;
});

module.exports = mongoose.model('Event', EventSchema);
