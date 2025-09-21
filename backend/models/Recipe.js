const mongoose = require('mongoose');
const slugify = require('slugify');

const RecipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, index: true },
    image: { type: String, required: true }, // URL for image
    ingredients: [{
      name: { type: String, required: true, trim: true },
      quantity: { type: String, required: true, trim: true }
    }],
    macronutrients: {
      calories: { type: Number, required: true, min: 0 },
      carbohydrates: { type: Number, required: true, min: 0 }, // in grams
      proteins: { type: Number, required: true, min: 0 }, // in grams
      fats: { type: Number, required: true, min: 0 } // in grams
    },
    category: {
      type: String,
      enum: [
        'High Protein',
        'Low Calories',
        'Weight Loss',
        'Weight Gain',
        'Healthy Desserts',
        'Vegan'
      ]
    },
    instructions: { type: String, required: true }, // Required cooking instructions
    published: { type: Boolean, default: true },
    publishedAt: { type: Date },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

RecipeSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    this.slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
  }
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Recipe', RecipeSchema);
