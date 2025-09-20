import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { commentsAPI } from '../services/api';

const Comments = ({ blogId, user }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  const fetchComments = async () => {
    try {
      const res = await commentsAPI.getComments(blogId);
      setComments(res.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (!user) {
      toast.error('Please login to post a comment');
      return;
    }

    setSubmitting(true);
    try {
      await commentsAPI.createComment({
        content: newComment.trim(),
        blogPost: blogId
      });
      setNewComment('');
      toast.success('Comment posted successfully');
      fetchComments(); // Refresh comments
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await commentsAPI.updateComment(commentId, {
        content: editContent.trim()
      });
      setEditingComment(null);
      setEditContent('');
      toast.success('Comment updated successfully');
      fetchComments(); // Refresh comments
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.deleteComment(commentId);
      toast.success('Comment deleted successfully');
      fetchComments(); // Refresh comments
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete comment');
    }
  };

  const startEdit = (comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <h3 style={{ marginBottom: '20px' }}>Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div className="form-group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="form-input"
              rows={3}
              maxLength={1000}
              required
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {newComment.length}/1000 characters
            </div>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="card text-center" style={{ marginBottom: '20px', padding: '16px' }}>
          <p>Please login to post a comment</p>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="card text-center" style={{ padding: '20px' }}>
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment._id} className="card" style={{ marginBottom: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <strong>{comment.author?.fullName || 'Anonymous'}</strong>
                  <span style={{ color: '#666', fontSize: '14px', marginLeft: '8px' }}>
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                {user && user._id === comment.author?._id && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => startEdit(comment)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="btn"
                      style={{ 
                        fontSize: '12px', 
                        padding: '4px 8px', 
                        backgroundColor: '#f44336', 
                        color: 'white' 
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              {editingComment === comment._id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="form-input"
                    rows={3}
                    maxLength={1000}
                    style={{ marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditComment(comment._id)}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                      disabled={!editContent.trim()}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', margin: 0 }}>
                  {comment.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;
