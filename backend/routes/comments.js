const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const BlogPost = require('../models/BlogPost');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get comments for a specific blog post
router.get('/blog/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify blog post exists
    const blogPost = await BlogPost.findById(blogId);
    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const comments = await Comment.find({ 
      blogPost: blogId, 
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName')
      .populate('parentComment', 'content author');

    const total = await Comment.countDocuments({ 
      blogPost: blogId, 
      isDeleted: false 
    });

    res.json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new comment (requires authentication)
router.post(
  '/',
  [
    auth,
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment content is required and must be less than 1000 characters'),
    body('blogPost').isMongoId().withMessage('Valid blog post ID is required'),
    body('parentComment').optional().isMongoId().withMessage('Parent comment must be a valid ID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, blogPost, parentComment } = req.body;

      // Verify blog post exists
      const post = await BlogPost.findById(blogPost);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      // If parentComment is provided, verify it exists
      if (parentComment) {
        const parent = await Comment.findById(parentComment);
        if (!parent || parent.blogPost.toString() !== blogPost) {
          return res.status(404).json({ message: 'Parent comment not found or does not belong to this blog post' });
        }
      }

      const comment = new Comment({
        content,
        author: req.user._id,
        blogPost,
        parentComment: parentComment || null,
      });

      await comment.save();
      await comment.populate('author', 'fullName');

      res.status(201).json({ 
        message: 'Comment created successfully', 
        comment 
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update a comment (only by the author)
router.put(
  '/:id',
  [
    auth,
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment content is required and must be less than 1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const comment = await Comment.findById(req.params.id);
      if (!comment || comment.isDeleted) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Check if user is the author of the comment
      if (comment.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only edit your own comments' });
      }

      comment.content = req.body.content;
      await comment.save();
      await comment.populate('author', 'fullName');

      res.json({ 
        message: 'Comment updated successfully', 
        comment 
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete a comment (soft delete - only by the author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author of the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    comment.isDeleted = true;
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
