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

    const filter = { status: 'published' };
    
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

// Trainer/Admin: get a single post owned by the requester (trainers can only access their own)
router.get('/mine/:id', auth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'fullName');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Admins can access any, trainers only their own
    if (req.user.role === 'trainer' && post.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own posts.' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get my blog by id error:', error);
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

// Trainer: get own blog posts
router.get('/my-posts', auth, async (req, res) => {
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

    const posts = await BlogPost.find(filter)
      .sort({ createdAt: -1 })
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
    console.error('Get trainer blog posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: get post by slug
router.get('/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' }).populate('author', 'fullName');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ post });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Trainer: create post
router.post(
  '/',
  [
    auth,
    // Remove adminAuth to allow trainers
    body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title is required and must be at most 150 characters'),
    body('content').trim().isLength({ min: 10 }).withMessage('Content is required'),
    body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
    body('categories').optional().isArray().withMessage('Categories must be an array of strings'),
    body('coverImageUrl').optional().isURL().withMessage('Cover image must be a valid URL'),
    body('status').optional().isIn(['draft', 'published']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, tags = [], categories = [], coverImageUrl, status } = req.body;

      // Admin-created posts default to 'published' unless explicitly provided; trainers always 'draft'
      const finalStatus = req.user.role === 'admin' ? (status || 'published') : 'draft';

      const post = new BlogPost({
        title,
        content,
        tags,
        categories,
        coverImageUrl,
        status: finalStatus,
        author: req.user._id,
      });
      if (finalStatus === 'published') {
        post.publishedAt = new Date();
      }
      await post.save();
      await post.populate('author', 'fullName');

      res.status(201).json({ message: 'Post created', post });
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Admin/Trainer: update post
router.put(
  '/:id',
  [
    auth,
    // Remove adminAuth to allow trainers to edit their own posts
    body('title').optional().trim().isLength({ min: 3, max: 150 }),
    body('content').optional().trim().isLength({ min: 10 }),
    body('tags').optional().isArray(),
    body('categories').optional().isArray().withMessage('Categories must be an array of strings'),
    body('coverImageUrl').optional().isURL(),
    body('status').optional().isIn(['draft', 'published']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await BlogPost.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });

      // Check ownership for trainers
      if (req.user.role === 'trainer' && post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only edit your own posts.' });
      }

      const { title, content, tags, categories, coverImageUrl, status } = req.body;
      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;
      if (tags !== undefined) post.tags = tags;
      if (categories !== undefined) post.categories = categories;
      if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
      if (status !== undefined && req.user.role === 'admin') {
        post.status = status;
        if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
        if (status === 'draft') post.publishedAt = null;
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

// Admin/Trainer: delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check ownership for trainers
    if (req.user.role === 'trainer' && post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own posts.' });
    }

    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: publish post
router.put('/:id/publish', auth, adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();
    await post.populate('author', 'fullName');

    res.json({ message: 'Post published', post });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: unpublish post
router.put('/:id/unpublish', auth, adminAuth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.status = 'draft';
    post.publishedAt = null;
    await post.save();
    await post.populate('author', 'fullName');

    res.json({ message: 'Post unpublished', post });
  } catch (error) {
    console.error('Unpublish post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
