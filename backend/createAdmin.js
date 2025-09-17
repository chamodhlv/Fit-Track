const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

const createAdminAccount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@fitcenter.com' });
    if (existingAdmin) {
      console.log('❌ Admin account already exists');
      process.exit(0);
    }

    // Create admin account
    const adminData = {
      fullName: 'Fitness Center Admin',
      email: 'admin@fitcenter.com',
      password: 'admin123',
      age: 30,
      weight: 70,
      height: 175,
      fitnessGoal: 'muscle_gain',
      experienceLevel: 'advanced',
      role: 'admin',
      isActive: true
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Create and save admin
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@fitcenter.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: Admin');

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

createAdminAccount();
