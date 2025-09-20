const express = require('express');
const { body, validationResult } = require('express-validator');
const Workout = require('../models/Workout');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/workouts
// @desc    Get all workouts for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const workouts = await Workout.find({ user: req.user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'fullName email');

    const total = await Workout.countDocuments({ user: req.user._id });

    res.json({
      workouts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workouts/history/calendar
// @desc    Get calendar data (dates with completed workouts) for a given month
// @access  Private
router.get('/history/calendar', auth, async (req, res) => {
  try {
    const { year, month } = req.query; // month: 1-12
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!y || !m || m < 1 || m > 12) {
      return res.status(400).json({ message: 'Please provide valid year and month (1-12)' });
    }

    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // first day of next month
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const results = await Workout.aggregate([
      { $match: { user: userId } },
      {
        $project: {
          datesRaw: {
            $concatArrays: [
              { $ifNull: ['$completions', []] },
              { $cond: [{ $ne: ['$completedAt', null] }, ['$completedAt'], []] }
            ]
          }
        }
      },
      {
        $project: {
          // Normalize to day and dedupe
          dates: {
            $setUnion: [
              {
                $map: {
                  input: '$datesRaw',
                  as: 'd',
                  in: { $dateTrunc: { date: '$$d', unit: 'day' } }
                }
              }
            ]
          }
        }
      },
      { $unwind: '$dates' },
      { $match: { dates: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dates' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const days = results.map(r => ({ date: r._id, count: r.count }));
    res.json({ days });
  } catch (error) {
    console.error('Get calendar history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workouts/history/by-date
// @desc    Get workouts completed on a specific date (YYYY-MM-DD)
// @access  Private
router.get('/history/by-date', auth, async (req, res) => {
  try {
    const { date } = req.query; // 'YYYY-MM-DD'
    if (!date) {
      return res.status(400).json({ message: 'Please provide date in YYYY-MM-DD format' });
    }

    const [y, m, d] = date.split('-').map(n => parseInt(n, 10));
    if (!y || !m || !d) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const workouts = await Workout.aggregate([
      { $match: { user: userId } },
      {
        $project: {
          doc: '$$ROOT',
          datesRaw: {
            $concatArrays: [
              { $ifNull: ['$completions', []] },
              { $cond: [{ $ne: ['$completedAt', null] }, ['$completedAt'], []] }
            ]
          }
        }
      },
      {
        $project: {
          doc: 1,
          dates: {
            $setUnion: [
              {
                $map: {
                  input: '$datesRaw',
                  as: 'd',
                  in: { $dateTrunc: { date: '$$d', unit: 'day' } }
                }
              }
            ]
          }
        }
      },
      { $unwind: '$dates' },
      { $match: { dates: { $gte: start, $lt: end } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { date: 1 } }
    ]);

    res.json({ workouts });
  } catch (error) {
    console.error('Get history by date error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workouts/stats/summary
// @desc    Get workout statistics for user
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalWorkouts = await Workout.countDocuments({ user: req.user._id });
    
    const workoutStats = await Workout.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$totalDuration' },
          avgDuration: { $avg: '$totalDuration' },
          totalExercises: { $sum: { $size: '$exercises' } }
        }
      }
    ]);

    const categoryStats = await Workout.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = workoutStats[0] || { totalDuration: 0, avgDuration: 0, totalExercises: 0 };

    res.json({
      totalWorkouts,
      totalDuration: stats.totalDuration,
      avgDuration: Math.round(stats.avgDuration || 0),
      totalExercises: stats.totalExercises,
      categoryBreakdown: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get workout stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workouts/:id
// @desc    Get workout by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id).populate('user', 'fullName email');
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check if workout belongs to user
    if (workout.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ workout });
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workouts
// @desc    Create new workout
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('exercises').isArray({ min: 1 }).withMessage('At least one exercise is required'),
  body('exercises.*.name').trim().isLength({ min: 1 }).withMessage('Exercise name is required'),
  body('exercises.*.sets').isInt({ min: 1 }).withMessage('Sets must be at least 1'),
  body('exercises.*.reps').isInt({ min: 1 }).withMessage('Reps must be at least 1'),
  body('exercises.*.weight').optional().isFloat({ min: 0 }).withMessage('Weight must be non-negative'),
  body('exercises.*.duration').optional().isFloat({ min: 0 }).withMessage('Duration must be non-negative'),
  body('totalDuration').optional().isFloat({ min: 0 }).withMessage('Total duration must be non-negative'),
  body('category').optional().isIn(['strength', 'cardio', 'flexibility', 'mixed']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, date, exercises, totalDuration, notes, category } = req.body;

    const workout = new Workout({
      user: req.user._id,
      title,
      date: date || new Date(),
      exercises,
      totalDuration: totalDuration || 0,
      notes,
      category: category || 'mixed'
    });

    await workout.save();
    await workout.populate('user', 'fullName email');

    res.status(201).json({
      message: 'Workout created successfully',
      workout
    });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update workout
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('exercises').optional().isArray({ min: 1 }).withMessage('At least one exercise is required'),
  body('exercises.*.name').optional().trim().isLength({ min: 1 }).withMessage('Exercise name is required'),
  body('exercises.*.sets').optional().isInt({ min: 1 }).withMessage('Sets must be at least 1'),
  body('exercises.*.reps').optional().isInt({ min: 1 }).withMessage('Reps must be at least 1'),
  body('exercises.*.weight').optional().isFloat({ min: 0 }).withMessage('Weight must be non-negative'),
  body('exercises.*.duration').optional().isFloat({ min: 0 }).withMessage('Duration must be non-negative'),
  body('totalDuration').optional().isFloat({ min: 0 }).withMessage('Total duration must be non-negative'),
  body('category').optional().isIn(['strength', 'cardio', 'flexibility', 'mixed']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workout = await Workout.findById(req.params.id);
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check if workout belongs to user
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, date, exercises, totalDuration, notes, category } = req.body;

    // Update workout fields
    if (title !== undefined) workout.title = title;
    if (date !== undefined) workout.date = date;
    if (exercises !== undefined) workout.exercises = exercises;
    if (totalDuration !== undefined) workout.totalDuration = totalDuration;
    if (notes !== undefined) workout.notes = notes;
    if (category !== undefined) workout.category = category;

    await workout.save();
    await workout.populate('user', 'fullName email');

    res.json({
      message: 'Workout updated successfully',
      workout
    });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/workouts/:id/complete
// @desc    Mark workout as completed
// @access  Private
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check if workout belongs to user
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If no completedAt provided, use current local date converted to UTC midnight
    let completedAt;
    if (req.body.completedAt) {
      completedAt = new Date(req.body.completedAt);
    } else {
      const now = new Date();
      completedAt = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    
    if (isNaN(completedAt.getTime())) {
      return res.status(400).json({ message: 'Invalid completedAt date' });
    }

    // Normalize to day for idempotency (UTC start of day)
    const dayKey = new Date(Date.UTC(completedAt.getUTCFullYear(), completedAt.getUTCMonth(), completedAt.getUTCDate()));
    // Check if day already exists in completions
    const exists = (workout.completions || []).some(d => {
      const dd = new Date(d);
      return dd.getUTCFullYear() === dayKey.getUTCFullYear() && dd.getUTCMonth() === dayKey.getUTCMonth() && dd.getUTCDate() === dayKey.getUTCDate();
    });
    if (!exists) {
      workout.completions = [...(workout.completions || []), dayKey];
    }
    // Maintain legacy flags for backward compatibility
    workout.completed = true;
    workout.completedAt = completedAt;
    await workout.save();
    await workout.populate('user', 'fullName email');

    res.json({ message: 'Workout marked as completed', workout });
  } catch (error) {
    console.error('Complete workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/workouts/:id/uncomplete
// @desc    Unmark a workout as completed for a specific date
// @access  Private
router.patch('/:id/uncomplete', auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check if workout belongs to user
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If no completedAt provided, use current local date converted to UTC midnight
    let completedAt;
    if (req.body.completedAt) {
      completedAt = new Date(req.body.completedAt);
    } else {
      const now = new Date();
      completedAt = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    
    if (isNaN(completedAt.getTime())) {
      return res.status(400).json({ message: 'Invalid completedAt date' });
    }

    const dayKey = new Date(Date.UTC(completedAt.getUTCFullYear(), completedAt.getUTCMonth(), completedAt.getUTCDate()));

    // Only allow undo for today's completion (UTC-normalized)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    if (dayKey.getTime() !== todayUTC.getTime()) {
      return res.status(400).json({ message: 'You can only undo today\'s completion.' });
    }

    const before = workout.completions?.length || 0;
    workout.completions = (workout.completions || []).filter(d => {
      const dd = new Date(d);
      return !(dd.getUTCFullYear() === dayKey.getUTCFullYear() && dd.getUTCMonth() === dayKey.getUTCMonth() && dd.getUTCDate() === dayKey.getUTCDate());
    });
    const after = workout.completions.length;

    // Also clear legacy completedAt if it points to the same UTC day
    if (workout.completedAt) {
      const ca = new Date(workout.completedAt);
      const sameDay = ca.getUTCFullYear() === dayKey.getUTCFullYear() && ca.getUTCMonth() === dayKey.getUTCMonth() && ca.getUTCDate() === dayKey.getUTCDate();
      if (sameDay) {
        workout.completedAt = null;
      }
    }

    // Set completed=false only if no completions remain and no completedAt remains
    if (after === 0 && !workout.completedAt) {
      workout.completed = false;
    }

    await workout.save();
    await workout.populate('user', 'fullName email');

    res.json({ message: before !== after ? 'Workout unmarked for that date' : 'No completion existed for that date', workout });
  } catch (error) {
    console.error('Uncomplete workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete workout
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Check if workout belongs to user
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Workout.findByIdAndDelete(req.params.id);

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
