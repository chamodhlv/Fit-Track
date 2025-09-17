// Alternative database setup for testing
const mongoose = require('mongoose');

// Use a public MongoDB Atlas connection for testing
const testConnectionString = 'mongodb+srv://testuser:testpass123@cluster0.mongodb.net/fitness_center_test?retryWrites=true&w=majority';

const connectToTestDB = async () => {
  try {
    await mongoose.connect(testConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to test MongoDB database');
    return true;
  } catch (error) {
    console.log('❌ Test database connection failed:', error.message);
    return false;
  }
};

module.exports = connectToTestDB;
