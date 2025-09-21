const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const email = getArg('--email', process.env.ADMIN_EMAIL);
    const password = getArg('--password', process.env.ADMIN_PASSWORD);
    const fullName = getArg('--name', process.env.ADMIN_NAME || 'Admin');
    const age = parseInt(getArg('--age', process.env.ADMIN_AGE || '30'), 10);
    const weight = parseFloat(getArg('--weight', process.env.ADMIN_WEIGHT || '70'));
    const height = parseFloat(getArg('--height', process.env.ADMIN_HEIGHT || '175'));
    const fitnessGoal = getArg('--fitnessGoal', process.env.ADMIN_FITNESS_GOAL || 'muscle gain');
    const experienceLevel = getArg('--experience', process.env.ADMIN_EXPERIENCE || 'advanced');
    const forcePw = process.argv.includes('--forcePassword');

    if (!email || !password) {
      throw new Error('Please provide --email and --password');
    }

    // Validate enums to satisfy schema
    const validGoals = ['weight loss', 'muscle gain', 'endurance', 'flexibility'];
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validGoals.includes(fitnessGoal)) {
      throw new Error(`Invalid fitnessGoal '${fitnessGoal}'. Must be one of: ${validGoals.join(', ')}`);
    }
    if (!validLevels.includes(experienceLevel)) {
      throw new Error(`Invalid experienceLevel '${experienceLevel}'. Must be one of: ${validLevels.join(', ')}`);
    }

    // Upsert target admin
    let user = await User.findOne({ email });
    if (user) {
      console.log(`ℹ️ User with ${email} exists. Updating role to admin...`);
      user.fullName = fullName;
      user.age = age;
      user.weight = weight;
      user.height = height;
      user.fitnessGoal = fitnessGoal;
      user.experienceLevel = experienceLevel;
      user.role = 'admin';
      user.isActive = true;
      if (forcePw) user.password = password; // pre-save hook will hash
      await user.save();
      console.log('✅ User updated as admin');
    } else {
      user = new User({
        fullName,
        email,
        password, // pre-save hook will hash
        age,
        weight,
        height,
        fitnessGoal,
        experienceLevel,
        role: 'admin',
        isActive: true,
      });
      await user.save();
      console.log('✅ Admin created');
    }

    // Remove other admins
    const result = await User.deleteMany({ role: 'admin', email: { $ne: email } });
    console.log(`🧹 Removed other admins: ${result.deletedCount}`);

    console.log('🎯 Single admin in system:', email);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
})();
