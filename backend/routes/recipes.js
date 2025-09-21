const express = require('express');
const { body, validationResult } = require('express-validator');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public: list published recipes with pagination and category filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    const filter = { published: true };
    
    // Category filtering
    if (category) filter.category = category;
    
    // Search filtering (case-insensitive search by recipe name)
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const recipes = await Recipe.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName');

    const total = await Recipe.countDocuments(filter);

    res.json({
      recipes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('List recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: get user's favorite recipes
router.get('/favorites', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'favoriteRecipes',
        match: { published: true },
        populate: { path: 'author', select: 'fullName' },
        options: {
          sort: { createdAt: -1 },
          skip: skip,
          limit: limit
        }
      });

    const favorites = user.favoriteRecipes || [];
    const total = await User.findById(req.user._id)
      .populate('favoriteRecipes', null, { published: true });
    
    res.json({
      recipes: favorites,
      totalPages: Math.ceil((total.favoriteRecipes?.length || 0) / limit),
      currentPage: page,
      total: total.favoriteRecipes?.length || 0,
    });
  } catch (error) {
    console.error('Get favorite recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle favorite recipe
router.post('/favorites/:id', auth, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user._id;

    // Check if recipe exists and is published
    const recipe = await Recipe.findOne({ _id: recipeId, published: true });
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const user = await User.findById(userId);
    const isFavorite = user.favoriteRecipes.includes(recipeId);

    if (isFavorite) {
      // Remove from favorites
      user.favoriteRecipes = user.favoriteRecipes.filter(id => id.toString() !== recipeId);
    } else {
      // Add to favorites
      user.favoriteRecipes.push(recipeId);
    }

    await user.save();

    res.json({
      message: isFavorite ? 'Recipe removed from favorites' : 'Recipe added to favorites',
      isFavorite: !isFavorite
    });
  } catch (error) {
    console.error('Toggle favorite recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: get a single recipe by ID for editing
router.get('/admin/:id', auth, adminAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('author', 'fullName');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json({ recipe });
  } catch (error) {
    console.error('Admin get recipe by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list all recipes (published and drafts)
router.get('/admin', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const recipes = await Recipe.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName');

    const total = await Recipe.countDocuments();

    res.json({
      recipes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Admin list recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: get recipe by slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ slug: req.params.slug, published: true }).populate('author', 'fullName');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    
    // Check if user has favorited this recipe (if authenticated)
    let isFavorite = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      isFavorite = user.favoriteRecipes.includes(recipe._id);
    }
    
    res.json({ recipe, isFavorite });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: create recipe
router.post(
  '/',
  [
    auth,
    adminAuth,
    body('name').trim().isLength({ min: 3, max: 150 }).withMessage('Recipe name is required and must be at most 150 characters'),
    body('image').trim().isLength({ min: 1 }).withMessage('Recipe image is required'),
    body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient is required'),
    body('ingredients.*.name').trim().isLength({ min: 1 }).withMessage('Ingredient name is required'),
    body('ingredients.*.quantity').trim().isLength({ min: 1 }).withMessage('Ingredient quantity is required'),
    body('macronutrients.calories').isNumeric({ min: 0 }).withMessage('Calories must be a positive number'),
    body('macronutrients.carbohydrates').isNumeric({ min: 0 }).withMessage('Carbohydrates must be a positive number'),
    body('macronutrients.proteins').isNumeric({ min: 0 }).withMessage('Proteins must be a positive number'),
    body('macronutrients.fats').isNumeric({ min: 0 }).withMessage('Fats must be a positive number'),
    body('category').optional().isIn(['High Protein', 'Low Calories', 'Weight Loss', 'Weight Gain', 'Healthy Desserts', 'Vegan']),
    body('instructions').trim().isLength({ min: 1 }).withMessage('Instructions are required'),
    body('published').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        name, 
        image, 
        ingredients, 
        macronutrients, 
        category, 
        instructions, 
        published = true 
      } = req.body;

      const recipe = new Recipe({
        name,
        image,
        ingredients,
        macronutrients,
        category,
        instructions,
        published,
        author: req.user._id,
      });

      await recipe.save();
      await recipe.populate('author', 'fullName');

      res.status(201).json({ message: 'Recipe created', recipe });
    } catch (error) {
      console.error('Create recipe error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Admin: update recipe
router.put(
  '/:id',
  [
    auth,
    adminAuth,
    body('name').optional().trim().isLength({ min: 3, max: 150 }),
    body('image').optional().trim().isLength({ min: 1 }),
    body('ingredients').optional().isArray({ min: 1 }),
    body('ingredients.*.name').optional().trim().isLength({ min: 1 }),
    body('ingredients.*.quantity').optional().trim().isLength({ min: 1 }),
    body('macronutrients.calories').optional().isNumeric({ min: 0 }),
    body('macronutrients.carbohydrates').optional().isNumeric({ min: 0 }),
    body('macronutrients.proteins').optional().isNumeric({ min: 0 }),
    body('macronutrients.fats').optional().isNumeric({ min: 0 }),
    body('category').optional().isIn(['High Protein', 'Low Calories', 'Weight Loss', 'Weight Gain', 'Healthy Desserts', 'Vegan']),
    body('instructions').optional().trim().isLength({ min: 1 }),
    body('published').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const recipe = await Recipe.findById(req.params.id);
      if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

      const { 
        name, 
        image, 
        ingredients, 
        macronutrients, 
        category, 
        instructions, 
        published 
      } = req.body;

      if (name !== undefined) recipe.name = name;
      if (image !== undefined) recipe.image = image;
      if (ingredients !== undefined) recipe.ingredients = ingredients;
      if (macronutrients !== undefined) recipe.macronutrients = { ...recipe.macronutrients, ...macronutrients };
      if (category !== undefined) recipe.category = category;
      if (instructions !== undefined) recipe.instructions = instructions;
      if (published !== undefined) {
        recipe.published = published;
        if (published && !recipe.publishedAt) recipe.publishedAt = new Date();
        if (!published) recipe.publishedAt = null;
      }

      await recipe.save();
      await recipe.populate('author', 'fullName');

      res.json({ message: 'Recipe updated', recipe });
    } catch (error) {
      console.error('Update recipe error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Admin: delete recipe
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Remove recipe from all users' favorites
    await User.updateMany(
      { favoriteRecipes: req.params.id },
      { $pull: { favoriteRecipes: req.params.id } }
    );

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
