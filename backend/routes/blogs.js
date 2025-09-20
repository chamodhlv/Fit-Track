const express = require('express');
const { body, validationResult } = require('express-validator');
const BlogPost = require('../models/BlogPost');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public: list published blog posts with pagination and category/tag filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const tag = req.query.tag;
    const category = req.query.category;

    const filter = { published: true };
    
    // Tag filtering (existing functionality)
    if (tag) filter.tags = { $in: [tag] };
    
    // Category filtering
    if (category) filter.categories = { $in: [category] };

    const posts = await BlogPost.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName');

    const total = await BlogPost.countDocuments(filter);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('List blogs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: get a single post by ID for editing
router.get('/admin/:id', auth, adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'fullName');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ post });
  } catch (error) {
    console.error('Admin get blog by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list all posts (published and drafts)
router.get('/admin', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await BlogPost.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName');

    const total = await BlogPost.countDocuments();

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Admin list blogs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: get post by slug
router.get('/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, published: true }).populate('author', 'fullName');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ post });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: create post
router.post(
  '/',
  [
    auth,
    adminAuth,
    body('title').trim().isLength({ min: 3 }).withMessage('Title is required'),
    body('content').trim().isLength({ min: 10 }).withMessage('Content is required'),
    body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
    body('categories').optional().isArray().withMessage('Categories must be an array of strings'),
    body('coverImageUrl').optional().isURL().withMessage('Cover image must be a valid URL'),
    body('published').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, tags = [], categories = [], coverImageUrl, published = true } = req.body;

      const post = new BlogPost({
        title,
        content,
        tags,
        categories,
        coverImageUrl,
        published,
        author: req.user._id,
      });

      await post.save();
      await post.populate('author', 'fullName');

      res.status(201).json({ message: 'Post created', post });
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Admin: update post
router.put(
  '/:id',
  [
    auth,
    adminAuth,
    body('title').optional().trim().isLength({ min: 3 }),
    body('content').optional().trim().isLength({ min: 10 }),
    body('tags').optional().isArray(),
    body('categories').optional().isArray().withMessage('Categories must be an array of strings'),
    body('coverImageUrl').optional().isURL(),
    body('published').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await BlogPost.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });

      const { title, content, tags, categories, coverImageUrl, published } = req.body;
      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;
      if (tags !== undefined) post.tags = tags;
      if (categories !== undefined) post.categories = categories;
      if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
      if (published !== undefined) {
        post.published = published;
        if (published && !post.publishedAt) post.publishedAt = new Date();
        if (!published) post.publishedAt = null;
      }

      await post.save();
      await post.populate('author', 'fullName');

      res.json({ message: 'Post updated', post });
    } catch (error) {
      console.error('Update blog error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Admin: delete post
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
