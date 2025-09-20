const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  reps: {
    type: Number,
    required: true,
    min: 1
  },
  weight: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
});

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  exercises: [exerciseSchema],
  totalDuration: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'mixed'],
    default: 'mixed'
  },
  // Completion fields for workout history and calendar
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date,
    default: null,
    index: true
  },
  // Multiple completion support: each entry is a Date when this workout was completed
  completions: {
    type: [Date],
    default: [],
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema);
