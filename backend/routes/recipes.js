const express = require('express');
const { body, validationResult } = require('express-validator');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');

const router = express.Router();

// Public: list published recipes with pagination and category filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    const filter = { status: 'published' };
    
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

// Trainer/Admin: get a single recipe owned by the requester (trainers can only access their own)
router.get('/mine/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('author', 'fullName');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Admins can access any, trainers only their own
    if (req.user.role === 'trainer' && recipe.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own recipes.' });
    }

    res.json({ recipe });
  } catch (error) {
    console.error('Get my recipe by id error:', error);
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
        match: { status: 'published' },
        populate: { path: 'author', select: 'fullName' },
        options: {
          sort: { createdAt: -1 },
          skip: skip,
          limit: limit
        }
      });

    const favorites = user.favoriteRecipes || [];
    const total = await User.findById(req.user._id)
      .populate('favoriteRecipes', null, { status: 'published' });
    
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
    const recipe = await Recipe.findOne({ _id: recipeId, status: 'published' });
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

// Trainer: get own recipes
router.get('/my-recipes', auth, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ message: 'Access denied. Trainers only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // filter by status if provided

    const filter = { author: req.user._id };
    if (status) filter.status = status;

    const recipes = await Recipe.find(filter)
      .sort({ createdAt: -1 })
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
    console.error('Get trainer recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: download a published recipe as PDF
router.get('/:slug/pdf', async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ slug: req.params.slug, status: 'published' }).populate('author', 'fullName');
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    res.setHeader('Content-Type', 'application/pdf');
    const safeSlug = String(req.params.slug || 'recipe').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="${safeSlug}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Title
    doc.font('Helvetica-Bold').fontSize(20).text(recipe.name || 'Untitled Recipe', { align: 'left' });
    doc.moveDown(0.5);

    // Image (if http/https URL)
    const imageUrl = typeof recipe.image === 'string' ? recipe.image.trim() : '';
    const isHttp = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));
    const fetchImageBuffer = (url) => new Promise((resolve) => {
      try {
        const client = url.startsWith('https://') ? https : http;
        client.get(url, (response) => {
          const status = response.statusCode || 0;
          const type = response.headers['content-type'] || '';
          if (status >= 300 && status < 400 && response.headers.location) {
            client.get(response.headers.location, (r2) => {
              const chunks2 = [];
              r2.on('data', (c) => chunks2.push(c));
              r2.on('end', () => resolve({ buffer: Buffer.concat(chunks2), contentType: r2.headers['content-type'] || '' }));
              r2.on('error', () => resolve(null));
            }).on('error', () => resolve(null));
            return;
          }
          if (!type.includes('image')) { resolve(null); return; }
          const chunks = [];
          response.on('data', (c) => chunks.push(c));
          response.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: type }));
          response.on('error', () => resolve(null));
        }).on('error', () => resolve(null));
      } catch {
        resolve(null);
      }
    });

    if (isHttp) {
      const result = await fetchImageBuffer(imageUrl);
      if (result && result.buffer && result.buffer.length > 0) {
        try {
          doc.image(result.buffer, { fit: [500, 300], align: 'center' });
          doc.moveDown();
        } catch {}
      }
    }

    // Meta info removed per request (Category/Prep Time/Servings)

    // Nutrition Facts
    if (recipe.macronutrients) {
      const m = recipe.macronutrients;
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Nutrition Facts');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).fillColor('#111827');
      doc.text(`Calories: ${m.calories ?? 0} kcal`);
      doc.text(`Protein: ${m.proteins ?? 0} g`);
      doc.text(`Carbs: ${m.carbohydrates ?? 0} g`);
      doc.text(`Fats: ${m.fats ?? 0} g`);
      doc.moveDown();
    }

    // Ingredients
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Ingredients');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).fillColor('#111827');
      for (const ing of recipe.ingredients) {
        const qty = ing.quantity ? `${ing.quantity} ` : '';
        const nm = ing.name || '';
        doc.text(`• ${qty}${nm}`);
      }
      doc.moveDown();
    }

    // Instructions
    if (recipe.instructions) {
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Instructions');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).fillColor('#111827').text(recipe.instructions, { width: 500 });
      doc.moveDown();
    }

    // Footer
    doc.moveDown();
    doc.fontSize(10).fillColor('#6b7280').text('Downloaded from Fit-Track', { align: 'center' });
    const _genDate = new Date();
    const _genLabel = _genDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.fontSize(9).fillColor('#9ca3af').text(`Generated on ${_genLabel}`, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: get recipe by slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ slug: req.params.slug, status: 'published' }).populate('author', 'fullName');
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

// Admin/Trainer: create recipe
router.post(
  '/',
  [
    auth,
    // Remove adminAuth to allow trainers
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
        status 
      } = req.body;

      // Admin-created recipes default to 'published' unless explicitly provided; trainers always 'draft'
      const finalStatus = req.user.role === 'admin' ? (status || 'published') : 'draft';

      const recipe = new Recipe({
        name,
        image,
        ingredients,
        macronutrients,
        category,
        instructions,
        status: finalStatus,
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

// Admin/Trainer: update recipe
router.put(
  '/:id',
  [
    auth,
    // Remove adminAuth to allow trainers to edit their own recipes
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

      // Check ownership for trainers
      if (req.user.role === 'trainer' && recipe.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only edit your own recipes.' });
      }

      const { 
        name, 
        image, 
        ingredients, 
        macronutrients, 
        category, 
        instructions, 
        status 
      } = req.body;

      if (name !== undefined) recipe.name = name;
      if (image !== undefined) recipe.image = image;
      if (ingredients !== undefined) recipe.ingredients = ingredients;
      if (macronutrients !== undefined) recipe.macronutrients = { ...recipe.macronutrients, ...macronutrients };
      if (category !== undefined) recipe.category = category;
      if (instructions !== undefined) recipe.instructions = instructions;
      if (status !== undefined && req.user.role === 'admin') {
        recipe.status = status;
        if (status === 'published' && !recipe.publishedAt) recipe.publishedAt = new Date();
        if (status === 'draft') recipe.publishedAt = null;
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

// Admin/Trainer: delete recipe
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Check ownership for trainers
    if (req.user.role === 'trainer' && recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own recipes.' });
    }

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

// Admin: publish recipe
router.put('/:id/publish', auth, adminAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.status = 'published';
    recipe.publishedAt = new Date();
    await recipe.save();
    await recipe.populate('author', 'fullName');

    res.json({ message: 'Recipe published', recipe });
  } catch (error) {
    console.error('Publish recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: unpublish recipe
router.put('/:id/unpublish', auth, adminAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    recipe.status = 'draft';
    recipe.publishedAt = null;
    await recipe.save();
    await recipe.populate('author', 'fullName');

    res.json({ message: 'Recipe unpublished', recipe });
  } catch (error) {
    console.error('Unpublish recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
