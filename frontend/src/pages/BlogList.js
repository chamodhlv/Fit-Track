import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogsAPI } from '../services/api';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const availableCategories = [
    'Strength Training',
    'Yoga & Flexibility',
    'Cardio & Endurance',
    'Weight Loss',
    'Muscle Building',
    'Health & Recovery'
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const filters = {};
        if (selectedCategory) filters.category = selectedCategory;
        
        const res = await blogsAPI.list(currentPage, 10, filters);
        setPosts(res.data.posts || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage, selectedCategory]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(1); // Reset to first page when filtering
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
        <h2 className="section-title">Blog</h2>
      </div>

      {/* Filter Section (Category only) */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', margin: 0 }}>Filter by Category:</label>
          {selectedCategory && (
            <button 
              type="button" 
              onClick={() => {
                setSelectedCategory('');
                setCurrentPage(1);
              }}
              className="btn btn-secondary"
            >
              Reset
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {/* All category */}
          <button
            onClick={() => handleCategoryChange('')}
            className={`btn ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              fontSize: '14px', 
              padding: '6px 12px',
              border: selectedCategory === '' ? '2px solid #007bff' : '1px solid #ddd'
            }}
          >
            All
          </button>

          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                fontSize: '14px', 
                padding: '6px 12px',
                border: selectedCategory === category ? '2px solid #007bff' : '1px solid #ddd'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>


      {posts.length === 0 ? (
        <div className="card text-center">
          <h3>No posts yet</h3>
          <p>Check back soon for new fitness articles.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map((p) => {
            const to = `/blog/${p.slug}`;
            const url = typeof p.coverImageUrl === 'string' ? p.coverImageUrl.trim() : '';
            const safeUrl = url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) ? url : '';
            const rawText = typeof p.content === 'string' ? p.content : '';
            const excerpt = rawText.length > 140 ? rawText.slice(0, 140).trim() + '…' : rawText;
            return (
              <Link key={p._id} to={to} className="blog-card" style={{ textDecoration: 'none' }}>
                {safeUrl ? (
                  <img
                    className="blog-card-img"
                    src={safeUrl}
                    alt={p.title}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/800x360?text=Image+not+available'; }}
                  />
                ) : (
                  <img
                    className="blog-card-img"
                    src={'https://via.placeholder.com/800x360?text=No+image'}
                    alt="no cover"
                  />
                )}
                <div className="blog-card-body">
                  <h3 className="blog-card-title">{p.title}</h3>
                  {excerpt && <p className="blog-card-excerpt">{excerpt}</p>}
                  {p.categories && p.categories.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      {p.categories.map((category, index) => (
                        <span
                          key={index}
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            marginRight: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? 'active' : ''}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogList;

