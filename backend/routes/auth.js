const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new member
// @access  Public
router.post('/register', [
  body('fullName').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
  body('age').isInt({ min: 13, max: 80 }).withMessage('Age must be between 13 and 80'),
  body('weight').isFloat({ min: 30, max: 200 }).withMessage('Weight must be between 30 and 200 kg'),
  body('height').isFloat({ min: 100, max: 215 }).withMessage('Height must be between 100 and 215 cm'),
  body('fitnessGoal').isIn(['weight loss', 'muscle gain', 'endurance', 'flexibility']).withMessage('Invalid fitness goal'),
  body('experienceLevel').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid experience level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, age, weight, height, fitnessGoal, experienceLevel } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    
    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      age,
      weight,
      height,
      fitnessGoal,
      experienceLevel,
      role: isFirstUser ? 'admin' : 'member'  // First user becomes admin
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        fitnessGoal: user.fitnessGoal,
        experienceLevel: user.experienceLevel
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/register-trainer
// @desc    Register a new trainer (pending approval)
// @access  Public
router.post('/register-trainer', [
  body('fullName').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
  body('bio').trim().isLength({ min: 10 }).withMessage('Bio must be at least 10 characters'),
  body('specialties').isArray({ min: 1 }).withMessage('At least one specialty is required'),
  body('specialties.*').isIn(['Weight Loss', 'Strength Training', 'Yoga Instructor', 'Bodybuilding']).withMessage('Invalid specialty'),
  body('sessionRate').isFloat({ min: 0 }).withMessage('Session rate must be a positive number'),
  body('availability.timeSlots').isArray({ min: 1 }).withMessage('At least one time slot is required'),
  body('profileImage').optional().isString().withMessage('Profile image must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      fullName, 
      email, 
      password, 
      bio, 
      specialties, 
      sessionRate,
      availability, 
      profileImage 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new trainer (pending approval)
    const trainer = new User({
      fullName,
      email,
      password,
      role: 'trainer',
      bio,
      specialties,
      sessionRate,
      availability,
      profileImage: profileImage || '',
      approvalStatus: 'pending',
      // Set dummy values for required member fields
      age: 25,
      weight: 70,
      height: 170,
      fitnessGoal: 'endurance',
      experienceLevel: 'advanced'
    });

    await trainer.save();

    res.status(201).json({
      message: 'Trainer registration submitted successfully. Your registration is pending for 24 hours until admin approval. If you cannot log in with your credentials after 24 hours, your registration has been rejected by the admin panel.',
      trainer: {
        id: trainer._id,
        fullName: trainer.fullName,
        email: trainer.email,
        role: trainer.role,
        approvalStatus: trainer.approvalStatus
      }
    });
  } catch (error) {
    console.error('Trainer registration error:', error);
    res.status(500).json({ message: 'Server error during trainer registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check trainer approval status
    if (user.role === 'trainer' && user.approvalStatus !== 'approved') {
      if (user.approvalStatus === 'pending') {
        return res.status(400).json({ message: 'Your trainer registration is still pending approval. Please wait for admin approval.' });
      } else if (user.approvalStatus === 'rejected') {
        return res.status(400).json({ message: 'Your trainer registration has been rejected by the admin.' });
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        fitnessGoal: user.fitnessGoal,
        experienceLevel: user.experienceLevel
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const base = {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
    };

    if (req.user.role === 'trainer') {
      return res.json({
        user: {
          ...base,
          bio: req.user.bio,
          specialties: req.user.specialties,
          sessionRate: req.user.sessionRate,
          sessionCapacity: req.user.sessionCapacity,
          availability: req.user.availability,
          profileImage: req.user.profileImage,
          approvalStatus: req.user.approvalStatus,
        }
      });
    }

    // member/admin fallback (member profile fields)
    return res.json({
      user: {
        ...base,
        age: req.user.age,
        weight: req.user.weight,
        height: req.user.height,
        fitnessGoal: req.user.fitnessGoal,
        experienceLevel: req.user.experienceLevel,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
