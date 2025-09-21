const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  age: {
    type: Number,
    required: true,
    min: 13,
    max: 100
  },
  weight: {
    type: Number,
    required: true,
    min: 30,
    max: 300
  },
  height: {
    type: Number,
    required: true,
    min: 100,
    max: 250
  },
  fitnessGoal: {
    type: String,
    required: true,
    enum: ['weight loss', 'muscle gain', 'endurance', 'flexibility']
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  role: {
    type: String,
    enum: ['member', 'admin', 'trainer'],
    default: 'member'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Trainer-specific fields
  bio: {
    type: String,
    required: function() { return this.role === 'trainer'; }
  },
  specialties: [{
    type: String,
    enum: ['Weight Loss', 'Strength Training', 'Yoga Instructor', 'Bodybuilding'],
    required: function() { return this.role === 'trainer'; }
  }],
  sessionRate: {
    type: Number,
    required: function() { return this.role === 'trainer'; },
    min: 0
  },
  availability: {
    timeSlots: [{
      start: String,
      end: String
    }]
  },
  profileImage: {
    type: String,
    default: ''
  },
  // Approval status for trainers
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() { return this.role === 'trainer' ? 'pending' : 'approved'; }
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  // Favorite recipes
  favoriteRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
