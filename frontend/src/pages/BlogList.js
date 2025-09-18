import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogsAPI } from '../services/api';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // simplified UI: no tag filter

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await blogsAPI.list(currentPage, 10);
        setPosts(res.data.posts || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage]);

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
