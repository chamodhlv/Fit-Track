const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

// GET /api/events - public list (with attendee count); if logged in, include attending flag
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Event.countDocuments({})
    ]);

    const userId = req.user?._id?.toString();
    const data = events.map((e) => ({
      _id: e._id,
      name: e.name,
      location: e.location,
      date: e.date,
      time: e.time,
      guests: e.guests,
      description: e.description,
      image: e.image,
      attendeeCount: e.attendees?.length || 0,
      attending: userId ? e.attendees.some((id) => id.toString() === userId) : false,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    res.json({ events: data, total, totalPages: Math.ceil(total / limit), page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - public detail
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e) return res.status(404).json({ message: 'Event not found' });
    const userId = req.user?._id?.toString();
    res.json({
      _id: e._id,
      name: e.name,
      location: e.location,
      date: e.date,
      time: e.time,
      guests: e.guests,
      description: e.description,
      image: e.image,
      attendeeCount: e.attendees?.length || 0,
      attending: userId ? e.attendees.some((id) => id.toString() === userId) : false,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// POST /api/events - admin create
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, location, date, time, guests, description, image } = req.body;
    if (!name || !location || !date || !time || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const event = await Event.create({
      name,
      location,
      date: new Date(date),
      time,
      guests: Array.isArray(guests) ? guests : [],
      description,
      image,
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// PUT /api/events/:id - admin update
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, location, date, time, guests, description, image } = req.body;
    const update = { name, location, time, description };
    if (date) update.date = new Date(date);
    if (guests) update.guests = guests;
    if (image !== undefined) update.image = image;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - admin delete
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// POST /api/events/:id/attendance - toggle attendance (auth users)
router.post('/:id/attendance', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const userId = req.user._id.toString();
    const idx = event.attendees.findIndex((id) => id.toString() === userId);
    let attending;
    if (idx === -1) {
      event.attendees.push(req.user._id);
      attending = true;
    } else {
      event.attendees.splice(idx, 1);
      attending = false;
    }
    await event.save();

    res.json({
      attending,
      attendeeCount: event.attendees.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to toggle attendance' });
  }
});

module.exports = router;
