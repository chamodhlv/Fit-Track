const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: 'member' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'member' });

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user's profile (Member/Trainer self-service)
// @access  Private
router.put('/me', [
  auth,
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('age').optional().isInt({ min: 13, max: 100 }).withMessage('Age must be between 13 and 100'),
  body('weight').optional().isFloat({ min: 30, max: 300 }).withMessage('Weight must be between 30 and 300 kg'),
  body('height').optional().isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100 and 250 cm'),
  body('fitnessGoal').optional().isIn(['weight loss', 'muscle gain', 'endurance', 'flexibility']).withMessage('Invalid fitness goal'),
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid experience level'),
  // Trainer-specific validations
  body('bio').optional().trim().isLength({ min: 10 }).withMessage('Bio must be at least 10 characters'),
  body('specialties').optional().isArray({ min: 1 }).withMessage('At least one specialty is required'),
  body('specialties.*').optional().isIn(['Weight Loss', 'Strength Training', 'Yoga Instructor', 'Bodybuilding']).withMessage('Invalid specialty'),
  body('sessionRate').optional().isFloat({ min: 0 }).withMessage('Session rate must be a positive number'),
  body('sessionCapacity').optional().isInt({ min: 1 }).withMessage('Session capacity must be at least 1'),
  body('availability.days').optional().isArray({ min: 1 }).withMessage('At least one available day is required'),
  body('availability.days.*').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day'),
  body('availability.timeSlots').optional().isArray({ min: 1 }).withMessage('At least one time slot is required'),
  body('profileImage').optional().isString().withMessage('Profile image must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Email uniqueness check if changing email
    if (req.body.email && req.body.email !== user.email) {
      const exists = await User.findOne({ email: req.body.email });
      if (exists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update common fields
    if (req.body.fullName !== undefined) user.fullName = req.body.fullName;
    if (req.body.email !== undefined) user.email = req.body.email;

    // Update member-specific fields
    if (user.role === 'member') {
      if (req.body.age !== undefined) user.age = req.body.age;
      if (req.body.weight !== undefined) user.weight = req.body.weight;
      if (req.body.height !== undefined) user.height = req.body.height;
      if (req.body.fitnessGoal !== undefined) user.fitnessGoal = req.body.fitnessGoal;
      if (req.body.experienceLevel !== undefined) user.experienceLevel = req.body.experienceLevel;
    }

    // Update trainer-specific fields
    if (user.role === 'trainer') {
      if (req.body.bio !== undefined) user.bio = req.body.bio;
      if (req.body.specialties !== undefined) user.specialties = req.body.specialties;
      if (req.body.sessionRate !== undefined) user.sessionRate = req.body.sessionRate;
      if (req.body.sessionCapacity !== undefined) user.sessionCapacity = req.body.sessionCapacity;
      if (req.body.availability !== undefined) user.availability = req.body.availability;
      if (req.body.profileImage !== undefined) user.profileImage = req.body.profileImage;
    }

    await user.save();

    // Return appropriate response based on role
    const responseUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };

    if (user.role === 'member') {
      responseUser.age = user.age;
      responseUser.weight = user.weight;
      responseUser.height = user.height;
      responseUser.fitnessGoal = user.fitnessGoal;
      responseUser.experienceLevel = user.experienceLevel;
    } else if (user.role === 'trainer') {
      responseUser.bio = user.bio;
      responseUser.specialties = user.specialties;
      responseUser.sessionRate = user.sessionRate;
      responseUser.sessionCapacity = user.sessionCapacity;
      responseUser.availability = user.availability;
      responseUser.profileImage = user.profileImage;
      responseUser.approvalStatus = user.approvalStatus;
    }

    res.json({
      message: 'Profile updated successfully',
      user: responseUser
    });
  } catch (error) {
    console.error('Update self profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', [
  auth,
  adminAuth,
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('age').optional().isInt({ min: 13, max: 100 }).withMessage('Age must be between 13 and 100'),
  body('weight').optional().isFloat({ min: 30, max: 300 }).withMessage('Weight must be between 30 and 300 kg'),
  body('height').optional().isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100 and 250 cm'),
  body('fitnessGoal').optional().isIn(['weight loss', 'muscle gain', 'endurance', 'flexibility']).withMessage('Invalid fitness goal'),
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid experience level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, age, weight, height, fitnessGoal, experienceLevel } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (age !== undefined) user.age = age;
    if (weight !== undefined) user.weight = weight;
    if (height !== undefined) user.height = height;
    if (fitnessGoal !== undefined) user.fitnessGoal = fitnessGoal;
    if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        fitnessGoal: user.fitnessGoal,
        experienceLevel: user.experienceLevel,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/trainers/pending
// @desc    Get all pending trainer registrations (Admin only)
// @access  Private/Admin
router.get('/trainers/pending', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trainers = await User.find({ 
      role: 'trainer', 
      approvalStatus: 'pending' 
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ 
      role: 'trainer', 
      approvalStatus: 'pending' 
    });

    res.json({
      trainers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get pending trainers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/trainers/:id/approve
// @desc    Approve trainer registration (Admin only)
// @access  Private/Admin
router.put('/trainers/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id);
    
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    if (trainer.role !== 'trainer') {
      return res.status(400).json({ message: 'User is not a trainer' });
    }

    if (trainer.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Trainer registration is not pending' });
    }

    trainer.approvalStatus = 'approved';
    trainer.approvedAt = new Date();
    trainer.rejectedAt = undefined;

    await trainer.save();

    res.json({ 
      message: 'Trainer approved successfully',
      trainer: {
        id: trainer._id,
        fullName: trainer.fullName,
        email: trainer.email,
        approvalStatus: trainer.approvalStatus,
        approvedAt: trainer.approvedAt
      }
    });
  } catch (error) {
    console.error('Approve trainer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/trainers/:id/reject
// @desc    Reject trainer registration (Admin only)
// @access  Private/Admin
router.put('/trainers/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id);
    
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    if (trainer.role !== 'trainer') {
      return res.status(400).json({ message: 'User is not a trainer' });
    }

    if (trainer.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Trainer registration is not pending' });
    }

    trainer.approvalStatus = 'rejected';
    trainer.rejectedAt = new Date();
    trainer.approvedAt = undefined;

    await trainer.save();

    res.json({ 
      message: 'Trainer rejected successfully',
      trainer: {
        id: trainer._id,
        fullName: trainer.fullName,
        email: trainer.email,
        approvalStatus: trainer.approvalStatus,
        rejectedAt: trainer.rejectedAt
      }
    });
  } catch (error) {
    console.error('Reject trainer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/trainers
// @desc    Get all approved trainers (Admin only)
// @access  Private/Admin
router.get('/trainers', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trainers = await User.find({ 
      role: 'trainer', 
      approvalStatus: 'approved' 
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ 
      role: 'trainer', 
      approvalStatus: 'approved' 
    });

    res.json({
      trainers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
