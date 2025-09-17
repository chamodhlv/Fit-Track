const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createDemoAccounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@fitcenter.com' });
    if (existingAdmin) {
      console.log('Admin account already exists');
    } else {
      // Create admin user
      const admin = new User({
        fullName: 'Admin User',
        email: 'admin@fitcenter.com',
        password: 'admin123', // Will be hashed automatically by the pre-save hook
        age: 30,
        weight: 75,
        height: 175,
        fitnessGoal: 'muscle gain',
        experienceLevel: 'advanced',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin account created: admin@fitcenter.com / admin123');
    }

    // Check if member already exists
    const existingMember = await User.findOne({ email: 'member@fitcenter.com' });
    if (existingMember) {
      console.log('Member account already exists');
    } else {
      // Create member user
      const member = new User({
        fullName: 'John Smith',
        email: 'member@fitcenter.com',
        password: 'member123', // Will be hashed automatically by the pre-save hook
        age: 25,
        weight: 70,
        height: 180,
        fitnessGoal: 'muscle gain',
        experienceLevel: 'intermediate',
        role: 'member'
      });
      await member.save();
      console.log('✅ Member account created: member@fitcenter.com / member123');
    }

    // Create additional demo members
    const demoMembers = [
      {
        fullName: 'Sarah Johnson',
        email: 'sarah@fitcenter.com',
        password: 'member123',
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
        password: 'member123',
        age: 32,
        weight: 85,
        height: 185,
        fitnessGoal: 'endurance',
        experienceLevel: 'advanced',
        role: 'member'
      }
    ];

    for (const memberData of demoMembers) {
      const existing = await User.findOne({ email: memberData.email });
      if (!existing) {
        const newMember = new User(memberData);
        await newMember.save();
        console.log(`✅ Demo member created: ${memberData.email} / member123`);
      } else {
        console.log(`Demo member ${memberData.email} already exists`);
      }
    }

    console.log('\n🎉 Demo accounts setup complete!');
    console.log('\n📋 Available Accounts:');
    console.log('👨‍💼 Admin: admin@fitcenter.com / admin123');
    console.log('👤 Member: member@fitcenter.com / member123');
    console.log('👤 Sarah: sarah@fitcenter.com / member123');
    console.log('👤 Mike: mike@fitcenter.com / member123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo accounts:', error);
    process.exit(1);
  }
};

createDemoAccounts();
