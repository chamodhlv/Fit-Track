const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the admin user
    const admin = await User.findOne({ email: 'admin@fitcenter.com' });
    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', {
      email: admin.email,
      role: admin.role,
      hasPassword: !!admin.password
    });

    // Test password comparison
    const isMatch = await admin.comparePassword('admin123');
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password does not match. Let me check the stored password hash...');
      console.log('Stored password hash:', admin.password);
    }

    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

testLogin();
