const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Booking = require('../models/Booking');

const router = express.Router();

// Helper: format currency LKR
const formatLKR = (amount) => `LKR ${Number(amount).toFixed(2)}`;

// POST /api/bookings - create a booking (Member only)
router.post(
  '/',
  auth,
  [
    body('trainerId').notEmpty().withMessage('Trainer ID is required'),
    body('date').isString().withMessage('Date is required in YYYY-MM-DD'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const memberId = req.user._id;
      const { trainerId, date } = req.body;

      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({ message: 'Invalid trainer ID' });
      }

      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== 'trainer' || trainer.approvalStatus !== 'approved') {
        return res.status(400).json({ message: 'Selected trainer is not available' });
      }

      // Prevent duplicate booking for the same member-trainer-date
      const existing = await Booking.findOne({
        member: memberId,
        trainer: trainerId,
        date,
        status: 'booked',
      });
      if (existing) {
        return res.status(400).json({ message: 'You already booked this trainer for the selected date' });
      }

      const booking = new Booking({
        member: memberId,
        trainer: trainerId,
        date,
        amount: trainer.sessionRate,
        location: 'Fit-Track GYM',
      });

      await booking.save();

      const populated = await booking.populate([
        { path: 'member', select: 'fullName email' },
        { path: 'trainer', select: 'fullName email sessionRate availability' },
      ]);

      res.status(201).json({
        message: 'Session booked successfully',
        booking: populated,
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/bookings/my - list my bookings (Member)
router.get('/my', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find({ member: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          { path: 'trainer', select: 'fullName sessionRate availability' },
        ]),
      Booking.countDocuments({ member: req.user._id }),
    ]);

    res.json({
      bookings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('List my bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/:id/receipt - download PDF receipt (Member or Trainer owner)
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate([
      { path: 'member', select: 'fullName email' },
      { path: 'trainer', select: 'fullName sessionRate availability' },
    ]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isMember = booking.member._id.toString() === req.user._id.toString();
    const isTrainer = booking.trainer._id.toString() === req.user._id.toString();
    if (!isMember && !isTrainer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this receipt' });
    }

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=booking-receipt-${booking._id}.pdf`);

    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .text('Fit-Track GYM', { align: 'center' })
      .moveDown(0.5)
      .fontSize(14)
      .text('Personal Trainer Session Receipt', { align: 'center' })
      .moveDown();

    // Booking info
    doc
      .fontSize(12)
      .text(`Receipt ID: ${booking._id}`)
      .text(`Date: ${booking.date}`)
      .text(`Location: ${booking.location}`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('Trainer Details')
      .font('Helvetica')
      .text(`Name: ${booking.trainer.fullName}`)
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .text('Member Details')
      .font('Helvetica')
      .text(`Name: ${booking.member.fullName}`)
      .text(`Email: ${booking.member.email}`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('Payment')
      .font('Helvetica')
      .text(`Amount to be paid at the counter: ${formatLKR(booking.amount)}`)
      .moveDown();

    doc
      .moveDown()
      .fontSize(10)
      .text('Show and pay the amount on the receipt to the counter and meet your trainer.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TRAINER: calendar counts per date for their clients
// GET /api/bookings/my-clients/calendar?year=YYYY&month=MM
router.get(
  '/my-clients/calendar',
  auth,
  [
    query('year').isInt({ min: 2000 }).withMessage('year is required'),
    query('month').isInt({ min: 1, max: 12 }).withMessage('month is required'),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'trainer') return res.status(403).json({ message: 'Trainer only' });
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { year, month } = req.query;
      // Find all bookings for trainer in given year-month
      const regex = new RegExp(`^${year}-${String(month).padStart(2, '0')}-`);
      const bookings = await Booking.find({ trainer: req.user._id, date: { $regex: regex }, status: 'booked' });
      const counts = {};
      bookings.forEach(b => {
        counts[b.date] = (counts[b.date] || 0) + 1;
      });
      res.json({ counts });
    } catch (error) {
      console.error('Trainer calendar error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// TRAINER: list clients by date
// GET /api/bookings/my-clients/by-date?date=YYYY-MM-DD
router.get('/my-clients/by-date', auth, [query('date').isString()], async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ message: 'Trainer only' });

    const { date } = req.query;
    const bookings = await Booking.find({ trainer: req.user._id, date, status: 'booked' })
      .populate([{ path: 'member', select: 'fullName email' }])
      .sort({ 'timeSlot.start': 1 });

    const clients = bookings.map(b => ({
      bookingId: b._id,
      fullName: b.member.fullName,
      email: b.member.email,
      time: (b.timeSlot && b.timeSlot.start && b.timeSlot.end) ? `${b.timeSlot.start} - ${b.timeSlot.end}` : 'All day',
    }));

    res.json({ date, clients });
  } catch (error) {
    console.error('Trainer clients by date error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
