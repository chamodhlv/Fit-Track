const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Workout = require('../models/Workout');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Workout.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      fullName: 'Admin User',
      email: 'admin@fitcenter.com',
      password: adminPassword,
      age: 30,
      weight: 75,
      height: 175,
      fitnessGoal: 'muscle gain',
      experienceLevel: 'advanced',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created');

    // Create demo member users
    const memberPassword = await bcrypt.hash('member123', 10);
    
    const members = [
      {
        fullName: 'John Smith',
        email: 'member@fitcenter.com',
        password: memberPassword,
        age: 25,
        weight: 70,
        height: 180,
        fitnessGoal: 'muscle gain',
        experienceLevel: 'intermediate',
        role: 'member'
      },
      {
        fullName: 'Sarah Johnson',
        email: 'sarah@fitcenter.com',
        password: memberPassword,
        age: 28,
        weight: 60,
        height: 165,
        fitnessGoal: 'weight loss',
        experienceLevel: 'beginner',
        role: 'member'
      },
      {
        fullName: 'Mike Wilson',
        email: 'mike@fitcenter.com',
        password: memberPassword,
        age: 32,
        weight: 85,
        height: 185,
        fitnessGoal: 'endurance',
        experienceLevel: 'advanced',
        role: 'member'
      },
      {
        fullName: 'Emily Davis',
        email: 'emily@fitcenter.com',
        password: memberPassword,
        age: 24,
        weight: 55,
        height: 160,
        fitnessGoal: 'flexibility',
        experienceLevel: 'intermediate',
        role: 'member'
      }
    ];

    const createdMembers = await User.insertMany(members);
    console.log('Demo members created');

    // Create sample workouts for the first member
    const sampleWorkouts = [
      {
        user: createdMembers[0]._id,
        title: 'Upper Body Strength',
        date: new Date('2024-01-15'),
        exercises: [
          {
            name: 'Bench Press',
            sets: 3,
            reps: 10,
            weight: 80,
            duration: 0,
            notes: 'Felt strong today'
          },
          {
            name: 'Pull-ups',
            sets: 3,
            reps: 8,
            weight: 0,
            duration: 0,
            notes: 'Need to improve form'
          },
          {
            name: 'Shoulder Press',
            sets: 3,
            reps: 12,
            weight: 25,
            duration: 0,
            notes: ''
          }
        ],
        totalDuration: 45,
        notes: 'Great workout, felt energized',
        category: 'strength'
      },
      {
        user: createdMembers[0]._id,
        title: 'Cardio Session',
        date: new Date('2024-01-17'),
        exercises: [
          {
            name: 'Treadmill Running',
            sets: 1,
            reps: 1,
            weight: 0,
            duration: 30,
            notes: '6.5 mph pace'
          },
          {
            name: 'Cycling',
            sets: 1,
            reps: 1,
            weight: 0,
            duration: 15,
            notes: 'High intensity intervals'
          }
        ],
        totalDuration: 45,
        notes: 'Good cardio session, heart rate stayed in target zone',
        category: 'cardio'
      },
      {
        user: createdMembers[0]._id,
        title: 'Lower Body Power',
        date: new Date('2024-01-20'),
        exercises: [
          {
            name: 'Squats',
            sets: 4,
            reps: 8,
            weight: 100,
            duration: 0,
            notes: 'Going deeper each set'
          },
          {
            name: 'Deadlifts',
            sets: 3,
            reps: 6,
            weight: 120,
            duration: 0,
            notes: 'Personal record!'
          },
          {
            name: 'Lunges',
            sets: 3,
            reps: 12,
            weight: 20,
            duration: 0,
            notes: 'Each leg'
          }
        ],
        totalDuration: 50,
        notes: 'Excellent session, hit new PR on deadlifts',
        category: 'strength'
      }
    ];

    await Workout.insertMany(sampleWorkouts);
    console.log('Sample workouts created');

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('Demo Accounts Created:');
    console.log('Admin: admin@fitcenter.com / admin123');
    console.log('Member: member@fitcenter.com / member123');
    console.log('Additional members: sarah@fitcenter.com, mike@fitcenter.com, emily@fitcenter.com (all with password: member123)');
    console.log('Sample workouts created for member@fitcenter.com');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
