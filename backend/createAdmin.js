const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const createAdminAccount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Read inputs (CLI args take precedence over env, then sensible defaults)
    const email = getArg('--email', process.env.ADMIN_EMAIL || 'admin@fitcenter.com');
    const password = getArg('--password', process.env.ADMIN_PASSWORD || 'admin123');
    const fullName = getArg('--name', process.env.ADMIN_NAME || 'Fitness Center Admin');
    const age = parseInt(getArg('--age', process.env.ADMIN_AGE || '30'), 10);
    const weight = parseFloat(getArg('--weight', process.env.ADMIN_WEIGHT || '70'));
    const height = parseFloat(getArg('--height', process.env.ADMIN_HEIGHT || '175'));
    const fitnessGoal = getArg('--fitnessGoal', process.env.ADMIN_FITNESS_GOAL || 'muscle gain');
    const experienceLevel = getArg('--experience', process.env.ADMIN_EXPERIENCE || 'advanced');

    // Validate against schema enums
    const validGoals = ['weight loss', 'muscle gain', 'endurance', 'flexibility'];
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validGoals.includes(fitnessGoal)) {
      throw new Error(`Invalid fitnessGoal '${fitnessGoal}'. Must be one of: ${validGoals.join(', ')}`);
    }
    if (!validLevels.includes(experienceLevel)) {
      throw new Error(`Invalid experienceLevel '${experienceLevel}'. Must be one of: ${validLevels.join(', ')}`);
    }

    // Check if a user with this email exists
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== 'admin') {
        console.log(`ℹ️ User with email ${email} already exists with role '${existing.role}'. Updating role to 'admin'...`);
        existing.role = 'admin';
        // Only update password if --forcePassword is provided
        const forcePw = process.argv.includes('--forcePassword');
        if (forcePw) existing.password = password; // pre-save hook will hash
        await existing.save();
        console.log('✅ Existing user promoted to admin successfully');
      } else {
        console.log('❌ Admin account already exists with this email');
      }
      return;
    }

    // Create admin account (pre-save hook will hash password)
    const adminData = {
      fullName,
      email,
      password,
      age,
      weight,
      height,
      fitnessGoal,
      experienceLevel,
      role: 'admin',
      isActive: true,
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin account created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('👤 Role: Admin');

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdminAccount();
