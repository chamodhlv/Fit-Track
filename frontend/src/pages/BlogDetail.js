import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogsAPI } from '../services/api';

const BlogDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{post.content}</div>
    </div>
  );
};

export default BlogDetail;
