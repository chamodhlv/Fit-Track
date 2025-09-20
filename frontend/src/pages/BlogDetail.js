import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogsAPI } from '../services/api';
import Comments from '../components/Comments';

const BlogDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await blogsAPI.getBySlug(slug);
        setPost(res.data.post);
      } catch (e) {
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container">
        <div className="card text-center">
          <h3>{error || 'Post not found'}</h3>
          <Link to="/blog" className="btn btn-primary" style={{ marginTop: 12 }}>Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-header">
        <h2 className="section-title">{post.title}</h2>
        <Link to="/blog" className="btn btn-secondary">Back</Link>
      </div>
      {(() => {
        const url = typeof post.coverImageUrl === 'string' ? post.coverImageUrl.trim() : '';
        const safeUrl = url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) ? url : '';
        return (
          <img
            src={safeUrl || 'https://via.placeholder.com/800x360?text=No+image'}
            alt={post.title}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/800x360?text=Image+not+available'; }}
            style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
          />
        );
      })()}
      
      {/* Categories */}
      {post.categories && post.categories.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <strong>Categories: </strong>
          {post.categories.map((category, index) => (
            <span
              key={index}
              style={{
                display: 'inline-block',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '14px',
                marginRight: '8px',
                marginBottom: '4px'
              }}
            >
              {category}
            </span>
          ))}
        </div>
      )}

      <div className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: '32px' }}>
        {post.content}
      </div>

      {/* Comments Section */}
      <Comments blogId={post._id} user={user} />
    </div>
  );
};

export default BlogDetail;
