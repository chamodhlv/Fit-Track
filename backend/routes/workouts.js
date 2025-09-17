const express = require('express');
const { body, validationResult } = require('express-validator');
const Workout = require('../models/Workout');
const { auth } = require('../middleware/auth');

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

// @route   GET /api/workouts/stats/summary
// @desc    Get workout statistics for user
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalWorkouts = await Workout.countDocuments({ user: req.user._id });
    
    const workoutStats = await Workout.aggregate([
      { $match: { user: req.user._id } },
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
      { $match: { user: req.user._id } },
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

module.exports = router;
