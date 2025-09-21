const mongoose = require('mongoose');
const slugify = require('slugify');

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    categories: [{
      type: String,
      enum: [
        'Strength Training',
        'Yoga & Flexibility', 
        'Cardio & Endurance',
        'Weight Loss',
        'Muscle Building',
        'Health & Recovery'
      ]
    }],
    coverImageUrl: { type: String },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

BlogPostSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    this.slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  } else if (this.status === 'draft') {
    this.publishedAt = null;
  }
  next();
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);
