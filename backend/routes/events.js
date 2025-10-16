const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const PDFDocument = require('pdfkit');
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
    const eventDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid event date' });
    }
    if (eventDay <= today) {
      return res.status(400).json({ message: 'Event date must be at least 1 day in the future' });
    }
    const event = await Event.create({
      name,
      location,
      date: eventDate,
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
    if (date) {
      const newDate = new Date(date);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({ message: 'Invalid event date' });
      }
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDay = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      if (eventDay <= today) {
        return res.status(400).json({ message: 'Event date must be at least 1 day in the future' });
      }
      update.date = newDate;
    }
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
    // Block toggling attendance on the event day
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
    if (eventDay.getTime() === today.getTime()) {
      return res.status(400).json({ message: 'Attendance cannot be changed on the event day' });
    }

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

// GET /api/events/:id/report - admin: download PDF report (no images) with attendees
router.get('/:id/report', auth, adminAuth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id).populate('attendees', 'fullName email');
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    res.setHeader('Content-Type', 'application/pdf');
    const safeName = String(ev.name || 'event').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="event-report-${safeName}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Title
    doc.font('Helvetica-Bold').fontSize(20).text(ev.name || 'Event', { align: 'left' });
    doc.moveDown(0.5);

    // Details (no image)
    const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const timeStr = ev.time || 'N/A';
    doc.font('Helvetica').fontSize(12).fillColor('#111827');
    doc.text(`Date: ${dateStr}`);
    doc.text(`Time: ${timeStr}`);
    doc.text(`Location: ${ev.location || 'N/A'}`);
    doc.moveDown(0.5);
    if (ev.description) {
      doc.font('Helvetica-Bold').text('Description');
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(11).text(ev.description, { width: 500 });
      doc.moveDown();
    }
    // Special Guests
    if (Array.isArray(ev.guests) && ev.guests.length) {
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Special Guests');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).fillColor('#111827');
      ev.guests.forEach((g, i) => {
        const gName = (g && g.name) ? g.name : 'Guest';
        const gQual = (g && g.qualification) ? g.qualification : '';
        const line = gQual ? `${i + 1}. ${gName} — ${gQual}` : `${i + 1}. ${gName}`;
        doc.text(line);
      });
      doc.moveDown();
    }

    // Attendees
    const attendees = Array.isArray(ev.attendees) ? ev.attendees : [];
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text(`Attendees (${attendees.length})`);
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#111827');
    if (attendees.length === 0) {
      doc.text('No attendees have marked attendance.');
    } else {
      attendees.forEach((u, idx) => {
        const name = u?.fullName || 'Unknown';
        const email = u?.email || '-';
        doc.text(`${idx + 1}. ${name} | ${email}`);
      });
    }

    // Footer
    doc.moveDown();
    doc.fontSize(10).fillColor('#6b7280').text('Downloaded from Fit-Track', { align: 'center' });
    const _genDate = new Date();
    const _genLabel = _genDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.fontSize(9).fillColor('#9ca3af').text(`Generated on ${_genLabel}`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate event report' });
  }
});

module.exports = router;
