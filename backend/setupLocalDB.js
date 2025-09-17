// Alternative: Use MongoDB locally or create a simple in-memory setup for testing
const mongoose = require('mongoose');

// Try to connect to local MongoDB first, then fallback to Atlas
const connectToDatabase = async () => {
  const localURI = 'mongodb://localhost:27017/fitness_center';
  const atlasURI = process.env.MONGODB_URI;
  
  console.log('Attempting to connect to database...');
  
  // Try local MongoDB first
  try {
    await mongoose.connect(localURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2000, // Short timeout for local
    });
    console.log('✅ Connected to local MongoDB');
    return true;
  } catch (localError) {
    console.log('❌ Local MongoDB not available, trying Atlas...');
    
    // Try Atlas if local fails
    try {
      await mongoose.connect(atlasURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB Atlas');
      return true;
    } catch (atlasError) {
      console.log('❌ Both local and Atlas connections failed');
      console.log('Local error:', localError.message);
      console.log('Atlas error:', atlasError.message);
      return false;
    }
  }
};

module.exports = connectToDatabase;
