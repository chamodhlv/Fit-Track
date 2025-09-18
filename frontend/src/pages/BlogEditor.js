import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { blogsAPI } from '../services/api';

const BlogEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const mode = useMemo(() => (id ? 'edit' : 'create'), [id]);

  const [loading, setLoading] = useState(mode === 'edit');
  const [form, setForm] = useState({
    title: '',
    content: '',
    coverImageUrl: '',
  });

  // Load existing post for edit
  useEffect(() => {
    const bootstrap = async () => {
      if (mode !== 'edit') return;
      // Prefer state if provided from navigation
      const fromState = location.state?.post;
      if (fromState) {
        setForm({
          title: fromState.title || '',
          content: fromState.content || '',
          coverImageUrl: fromState.coverImageUrl || '',
        });
        setLoading(false);
        return;
      }
      try {
        const res = await blogsAPI.getById(id);
        const p = res.data?.post;
        setForm({
          title: p?.title || '',
          content: p?.content || '',
          coverImageUrl: p?.coverImageUrl || '',
        });
      } catch (e) {
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id, location.state, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      content: form.content,
      coverImageUrl: form.coverImageUrl || undefined,
    };
    try {
      if (mode === 'edit') {
        await blogsAPI.update(id, payload);
        toast.success('Post updated');
      } else {
        await blogsAPI.create(payload);
        toast.success('Post created');
      }
      navigate('/admin');
    } catch (error) {
      const errs = error?.response?.data?.errors;
      if (Array.isArray(errs) && errs.length) {
        toast.error(errs.map((e) => e.msg).join('\n'));
      } else {
        toast.error(error?.response?.data?.message || 'Save failed');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-header">
        <h2 className="section-title">{mode === 'edit' ? 'Edit Post' : 'Create Post'}</h2>
        <Link to="/admin" className="btn btn-secondary">Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 16 }}>
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="form-input"
            placeholder="Enter title"
          />
        </div>

        <div className="form-group">
          <label>Content *</label>
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="form-input"
            placeholder="Write your article..."
            rows={12}
          />
        </div>

        <div className="form-group">
          <label>Cover Image URL</label>
          <input
            type="url"
            value={form.coverImageUrl}
            onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
            className="form-input"
            placeholder="https://... or /images/cover.jpg"
          />
        </div>

        {form.coverImageUrl ? (
          <img
            src={form.coverImageUrl}
            alt="cover preview"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/800x360?text=Preview+not+available'; }}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
          />
        ) : null}

        

        <div className="modal-footer" style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin')}>Cancel</button>
          <button type="submit" className="btn btn-primary">{mode === 'edit' ? 'Save Changes' : 'Create Post'}</button>
        </div>
      </form>
    </div>
  );
};

export default BlogEditor;
