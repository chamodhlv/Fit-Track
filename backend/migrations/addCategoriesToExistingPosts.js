const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const addCategoriesToExistingPosts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all blog posts without categories
    const postsWithoutCategories = await BlogPost.find({
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } }
      ]
    });

    console.log(`Found ${postsWithoutCategories.length} posts without categories`);

    // Update each post with a default category based on content analysis
    for (const post of postsWithoutCategories) {
      let defaultCategories = ['Health & Recovery']; // Default fallback category

      // Simple keyword-based category assignment
      const content = (post.title + ' ' + post.content).toLowerCase();
      
      if (content.includes('strength') || content.includes('weight') || content.includes('muscle')) {
        defaultCategories = ['Strength Training', 'Muscle Building'];
      } else if (content.includes('cardio') || content.includes('running') || content.includes('endurance')) {
        defaultCategories = ['Cardio & Endurance'];
      } else if (content.includes('yoga') || content.includes('flexibility') || content.includes('stretch')) {
        defaultCategories = ['Yoga & Flexibility'];
      } else if (content.includes('weight loss') || content.includes('fat') || content.includes('diet')) {
        defaultCategories = ['Weight Loss'];
      }

      await BlogPost.findByIdAndUpdate(post._id, {
        categories: defaultCategories
      });

      console.log(`Updated post "${post.title}" with categories: ${defaultCategories.join(', ')}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  addCategoriesToExistingPosts();
}

module.exports = addCategoriesToExistingPosts;
