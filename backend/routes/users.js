const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// ===== PUBLIC TRAINER BROWSING =====
// @route   GET /api/users/public-trainers
// @desc    Public: list approved trainers with basic info
// @access  Public
router.get('/public-trainers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { role: 'trainer', approvalStatus: 'approved' };
    const [trainers, total] = await Promise.all([
      User.find(filter)
        .select('fullName bio specialties sessionRate availability profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      trainers,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Public list trainers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/public-trainers/:id
// @desc    Public: get single approved trainer by id
// @access  Public
router.get('/public-trainers/:id', async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id)
      .select('fullName bio specialties sessionRate availability profileImage approvalStatus role');
    if (!trainer || trainer.role !== 'trainer' || trainer.approvalStatus !== 'approved') {
      return res.status(404).json({ message: 'Trainer not found' });
    }
    res.json({ trainer });
  } catch (error) {
    console.error('Public get trainer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
      .limit(limit)
      .lean();

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

// ===== TRAINER ROUTES (must come before /:id routes) =====

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
      .limit(limit)
      .lean();

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

// @route   GET /api/users/trainers
// @desc    Get all trainers with optional status filter (Admin only)
// @access  Private/Admin
router.get('/trainers', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let filter = { role: 'trainer' };
    if (status && status !== 'all') {
      filter.approvalStatus = status;
    }

    const trainers = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

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

// @route   POST /api/users/trainers
// @desc    Create a new trainer (Admin only)
// @access  Private/Admin
router.post('/trainers', [
  auth,
  adminAuth,
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('age').isInt({ min: 13, max: 100 }).withMessage('Age must be between 13 and 100'),
  body('weight').isFloat({ min: 30, max: 300 }).withMessage('Weight must be between 30 and 300 kg'),
  body('height').isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100 and 250 cm'),
  body('fitnessGoal').isIn(['weight loss', 'muscle gain', 'endurance', 'flexibility']).withMessage('Invalid fitness goal'),
  body('experienceLevel').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid experience level'),
  body('bio').trim().isLength({ min: 10 }).withMessage('Bio must be at least 10 characters'),
  body('specialties').isArray({ min: 1 }).withMessage('At least one specialty is required'),
  body('specialties.*').isIn(['Weight Loss', 'Strength Training', 'Yoga Instructor', 'Bodybuilding']).withMessage('Invalid specialty'),
  body('sessionRate').isFloat({ min: 0 }).withMessage('Session rate must be a positive number'),
  body('sessionCapacity').optional().isInt({ min: 1 }).withMessage('Session capacity must be at least 1'),
  body('availability.days').optional().isArray().withMessage('Days must be an array if provided'),
  body('availability.days.*').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day'),
  body('availability.timeSlots').isArray({ min: 1 }).withMessage('At least one time slot is required'),
  body('profileImage').optional().isString().withMessage('Profile image must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, age, weight, height, fitnessGoal, experienceLevel, bio, specialties, sessionRate, sessionCapacity, availability, profileImage, approvalStatus } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new trainer
    const trainer = new User({
      fullName,
      email,
      password,
      age,
      weight,
      height,
      fitnessGoal,
      experienceLevel,
      role: 'trainer',
      bio,
      specialties,
      sessionRate,
      sessionCapacity: sessionCapacity || 1,
      availability,
      profileImage: profileImage || '',
      approvalStatus: approvalStatus || 'approved'
    });

    await trainer.save();

    res.status(201).json({
      message: 'Trainer created successfully',
      trainer: {
        id: trainer._id,
        fullName: trainer.fullName,
        email: trainer.email,
        role: trainer.role,
        approvalStatus: trainer.approvalStatus
      }
    });
  } catch (error) {
    console.error('Create trainer error:', error);
    res.status(500).json({ message: 'Server error during trainer creation' });
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

// @route   PUT /api/users/trainers/:id
// @desc    Update trainer (Admin only)
// @access  Private/Admin
router.put('/trainers/:id', [
  auth,
  adminAuth,
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
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

    const trainer = await User.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    if (trainer.role !== 'trainer') {
      return res.status(400).json({ message: 'User is not a trainer' });
    }

    // Email uniqueness check if changing email
    if (req.body.email && req.body.email !== trainer.email) {
      const exists = await User.findOne({ email: req.body.email });
      if (exists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update fields
    if (req.body.fullName !== undefined) trainer.fullName = req.body.fullName;
    if (req.body.email !== undefined) trainer.email = req.body.email;
    if (req.body.bio !== undefined) trainer.bio = req.body.bio;
    if (req.body.specialties !== undefined) trainer.specialties = req.body.specialties;
    if (req.body.sessionRate !== undefined) trainer.sessionRate = req.body.sessionRate;
    if (req.body.sessionCapacity !== undefined) trainer.sessionCapacity = req.body.sessionCapacity;
    if (req.body.availability !== undefined) trainer.availability = req.body.availability;
    if (req.body.profileImage !== undefined) trainer.profileImage = req.body.profileImage;

    await trainer.save();

    res.json({
      message: 'Trainer updated successfully',
      trainer: {
        id: trainer._id,
        fullName: trainer.fullName,
        email: trainer.email,
        role: trainer.role,
        approvalStatus: trainer.approvalStatus
      }
    });
  } catch (error) {
    console.error('Update trainer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/trainers/:id
// @desc    Delete trainer (Admin only)
// @access  Private/Admin
router.delete('/trainers/:id', auth, adminAuth, async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id);
    
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    if (trainer.role !== 'trainer') {
      return res.status(400).json({ message: 'User is not a trainer' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error('Delete trainer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== GENERIC USER ROUTES (must come after specific routes) =====

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

module.exports = router;
