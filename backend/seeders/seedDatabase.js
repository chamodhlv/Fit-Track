const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Recipe = require('../models/Recipe');
const BlogPost = require('../models/BlogPost');
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
    await Recipe.deleteMany({});
    await BlogPost.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user (use plaintext password; model pre-save hook will hash it)
    const admin = new User({
      fullName: 'Admin User',
      email: 'admin@fitcenter.com',
      password: 'admin123',
      age: 30,
      weight: 75,
      height: 175,
      fitnessGoal: 'muscle gain',
      experienceLevel: 'advanced',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created');

    // Create demo member users (use plaintext password; model pre-save hook will hash it)
    const members = [
      {
        fullName: 'John Smith',
        email: 'member@fitcenter.com',
        password: 'member123',
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

    // Create trainer user (use plaintext password; model pre-save hook will hash it)
    const trainer = new User({
      fullName: 'Alex Johnson',
      email: 'trainer@fitcenter.com',
      password: 'trainer123',
      age: 29,
      weight: 75,
      height: 178,
      fitnessGoal: 'muscle gain',
      experienceLevel: 'advanced',
      role: 'trainer',
      bio: 'Certified personal trainer with 5+ years of experience in strength training and nutrition.',
      specialties: ['Strength Training', 'Weight Loss'],
      sessionRate: 50,
      sessionCapacity: 3,
      availability: {
        days: ['Monday', 'Wednesday', 'Friday'],
        timeSlots: [{ start: '09:00', end: '17:00' }]
      },
      approvalStatus: 'approved'
    });
    await trainer.save();
    console.log('Trainer user created');

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

    // Create sample recipes
    const sampleRecipes = [
      {
        name: 'High Protein Chicken Bowl',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        ingredients: [
          { name: 'Chicken Breast', quantity: '200g' },
          { name: 'Brown Rice', quantity: '1 cup' },
          { name: 'Broccoli', quantity: '150g' },
          { name: 'Olive Oil', quantity: '1 tbsp' }
        ],
        macronutrients: {
          calories: 450,
          carbohydrates: 35,
          proteins: 40,
          fats: 12
        },
        category: 'High Protein',
        instructions: 'Season and grill chicken breast. Cook brown rice according to package instructions. Steam broccoli until tender. Combine all ingredients in a bowl and drizzle with olive oil.',
        prepTime: 25,
        servings: 1,
        status: 'published',
        publishedAt: new Date(),
        author: admin._id
      },
      {
        name: 'Protein Smoothie Bowl',
        image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400',
        ingredients: [
          { name: 'Protein Powder', quantity: '1 scoop' },
          { name: 'Banana', quantity: '1 piece' },
          { name: 'Greek Yogurt', quantity: '150g' },
          { name: 'Berries', quantity: '100g' },
          { name: 'Almonds', quantity: '20g' }
        ],
        macronutrients: {
          calories: 380,
          carbohydrates: 32,
          proteins: 35,
          fats: 8
        },
        category: 'High Protein',
        instructions: 'Blend protein powder, banana, and Greek yogurt until smooth. Pour into bowl and top with berries and almonds.',
        prepTime: 10,
        servings: 1,
        status: 'published',
        publishedAt: new Date(),
        author: admin._id
      },
      {
        name: 'Trainer\'s Special Salad',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        ingredients: [
          { name: 'Mixed Greens', quantity: '100g' },
          { name: 'Grilled Chicken', quantity: '150g' },
          { name: 'Cherry Tomatoes', quantity: '50g' },
          { name: 'Avocado', quantity: '0.5 piece' }
        ],
        macronutrients: {
          calories: 320,
          carbohydrates: 12,
          proteins: 28,
          fats: 18
        },
        category: 'Weight Loss',
        instructions: 'Mix all ingredients in a large bowl. Add your favorite low-calorie dressing.',
        prepTime: 15,
        servings: 1,
        status: 'draft',
        author: trainer._id
      }
    ];

    for (const recipeData of sampleRecipes) {
      try {
        const recipe = new Recipe(recipeData);
        await recipe.save();
        console.log(`Recipe created: ${recipe.name}`);
      } catch (error) {
        console.error(`Error creating recipe ${recipeData.name}:`, error.message);
      }
    }
    console.log('Sample recipes created');

    // Create sample blog posts
    const sampleBlogPosts = [
      {
        title: 'The Ultimate Guide to Strength Training',
        content: 'Strength training is one of the most effective ways to build muscle, increase bone density, and improve overall health. In this comprehensive guide, we\'ll cover the fundamentals of strength training, including proper form, progressive overload, and program design. Whether you\'re a beginner or looking to take your training to the next level, this guide has everything you need to know.',
        tags: ['strength training', 'fitness', 'muscle building'],
        categories: ['Strength Training', 'Muscle Building'],
        coverImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
        status: 'published',
        publishedAt: new Date(),
        author: admin._id
      },
      {
        title: 'Nutrition Tips for Weight Loss',
        content: 'Losing weight can be challenging, but with the right nutrition strategies, you can achieve your goals. This post covers the basics of creating a caloric deficit, choosing nutrient-dense foods, and maintaining a sustainable eating plan. Learn about portion control, meal timing, and how to make healthy choices that support your weight loss journey.',
        tags: ['nutrition', 'weight loss', 'healthy eating'],
        categories: ['Weight Loss', 'Health & Recovery'],
        coverImageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
        status: 'published',
        publishedAt: new Date(),
        author: admin._id
      },
      {
        title: 'My Journey as a Personal Trainer',
        content: 'Starting as a personal trainer has been an incredible journey. In this post, I share my experiences, challenges, and the rewarding moments of helping clients achieve their fitness goals. From my first certification to working with diverse clients, I\'ll give you insights into what it\'s really like to be a trainer.',
        tags: ['personal training', 'career', 'fitness journey'],
        categories: ['Strength Training'],
        coverImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
        status: 'draft',
        author: trainer._id
      }
    ];

    for (const postData of sampleBlogPosts) {
      try {
        const post = new BlogPost(postData);
        await post.save();
        console.log(`Blog post created: ${post.title}`);
      } catch (error) {
        console.error(`Error creating blog post ${postData.title}:`, error.message);
      }
    }
    console.log('Sample blog posts created');

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('Demo Accounts Created:');
    console.log('Admin: admin@fitcenter.com / admin123');
    console.log('Trainer: trainer@fitcenter.com / trainer123');
    console.log('Member: member@fitcenter.com / member123');
    console.log('Additional members: sarah@fitcenter.com, mike@fitcenter.com, emily@fitcenter.com (all with password: member123)');
    console.log('Sample workouts created for member@fitcenter.com');
    console.log('Sample recipes and blog posts created (2 published, 1 draft each)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
