const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    content: { 
      type: String, 
      required: true, 
      trim: true,
      maxLength: 1000
    },
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    blogPost: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'BlogPost', 
      required: true 
    },
    parentComment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Comment', 
      default: null 
    }, // For nested replies (optional feature)
    isDeleted: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

// Index for efficient querying
CommentSchema.index({ blogPost: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
