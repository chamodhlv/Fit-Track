import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { recipesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const RecipeList = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const availableCategories = [
    'High Protein',
    'Low Calories',
    'Weight Loss',
    'Weight Gain',
    'Healthy Desserts',
    'Vegan'
  ];

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let res;
      
      if (showFavorites && user) {
        res = await recipesAPI.getFavorites(currentPage, 10);
        // For favorites, all recipes are favorited by definition
        const favoriteIds = new Set(res.data.recipes?.map(recipe => recipe._id) || []);
        setFavoriteRecipeIds(favoriteIds);
      } else {
        const filters = {};
        if (selectedCategory) filters.category = selectedCategory;
        if (debouncedQuery.trim()) filters.search = debouncedQuery.trim();
        res = await recipesAPI.list(currentPage, 10, filters);
        
        // Fetch user's favorites to mark them in the list
        if (user) {
          try {
            const favRes = await recipesAPI.getFavorites(1, 1000); // Get all favorites
            const favoriteIds = new Set(favRes.data.recipes?.map(recipe => recipe._id) || []);
            setFavoriteRecipeIds(favoriteIds);
          } catch (error) {
            console.error('Failed to fetch favorites:', error);
          }
        }
      }
      
      setRecipes(res.data.recipes || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
      if (isInitialLoad) setIsInitialLoad(false);
    }
  };

  // Debounce the search query so we don't fetch on every keypress
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    fetchRecipes();
  }, [currentPage, selectedCategory, showFavorites, user, debouncedQuery]);

  const handleCategoryChange = (category) => {
    if (category === 'favorites') {
      setShowFavorites(true);
      setSelectedCategory('');
    } else {
      setShowFavorites(false);
      setSelectedCategory(category === selectedCategory ? '' : category);
    }
    setCurrentPage(1);
  };

  const toggleFavorite = async (recipeId) => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    try {
      const res = await recipesAPI.toggleFavorite(recipeId);
      toast.success(res.data.message);
      
      // Update local state
      const newFavoriteIds = new Set(favoriteRecipeIds);
      if (res.data.isFavorite) {
        newFavoriteIds.add(recipeId);
      } else {
        newFavoriteIds.delete(recipeId);
      }
      setFavoriteRecipeIds(newFavoriteIds);
      
      // If we're viewing favorites and this was unfavorited, refresh the list
      if (showFavorites && !res.data.isFavorite) {
        fetchRecipes();
      }
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  if (loading && isInitialLoad) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-header">
        <h2 className="section-title">Recipes</h2>
      </div>

      {/* Search Section */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: 'bold', minWidth: 'fit-content' }}>Search Recipes:</label>
          <input
            type="text"
            placeholder="Search by recipe name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="form-input"
            style={{ 
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {loading && !isInitialLoad && (
            <span style={{ fontSize: '13px', color: '#666' }}>Searching…</span>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '14px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', margin: 0 }}>Filter by Category:</label>
          {(selectedCategory || showFavorites || searchQuery) && (
            <button 
              type="button" 
              onClick={() => {
                setSelectedCategory('');
                setShowFavorites(false);
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="btn btn-secondary"
            >
              Reset
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {/* Favorites category (only for logged-in users) */}
          {user && (
            <button
              onClick={() => handleCategoryChange('favorites')}
              className={`btn ${showFavorites ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                fontSize: '14px', 
                padding: '6px 12px',
                border: showFavorites ? '2px solid #ff6b6b' : '1px solid #ddd',
                backgroundColor: showFavorites ? '#ff6b6b' : '',
                color: showFavorites ? 'white' : ''
              }}
            >
              ❤️ Favorites
            </button>
          )}

          {/* All category */}
          <button
            onClick={() => handleCategoryChange('')}
            className={`btn ${!selectedCategory && !showFavorites ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              fontSize: '14px', 
              padding: '6px 12px',
              border: !selectedCategory && !showFavorites ? '2px solid #007bff' : '1px solid #ddd'
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

      {recipes.length === 0 ? (
        <div className="card text-center">
          <h3>{showFavorites ? 'No favorite recipes yet' : 'No recipes yet'}</h3>
          <p>{showFavorites ? 'Start adding recipes to your favorites!' : 'Check back soon for new fitness recipes.'}</p>
        </div>
      ) : (
        <div className="recipe-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {recipes.map((recipe) => {
            const safeUrl = recipe.image && (recipe.image.startsWith('http://') || recipe.image.startsWith('https://') || recipe.image.startsWith('/')) ? recipe.image : '';
            return (
              <div key={recipe._id} className="recipe-card" style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                overflow: 'hidden',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Link to={`/recipes/${recipe.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {safeUrl ? (
                    <img
                      src={safeUrl}
                      alt={recipe.name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Recipe+Image'; }}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={'https://via.placeholder.com/400x250?text=No+image'}
                      alt="no image"
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  )}
                </Link>
                
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <Link to={`/recipes/${recipe.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{recipe.name}</h3>
                    </Link>
                    {user && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(recipe._id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '20px',
                          cursor: 'pointer',
                          marginLeft: '8px'
                        }}
                        title={favoriteRecipeIds.has(recipe._id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {favoriteRecipeIds.has(recipe._id) ? '❤️' : '🤍'}
                      </button>
                    )}
                  </div>
                  
                  {/* Macronutrients */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', color: '#666' }}>
                      <div>🔥 {recipe.macronutrients?.calories || 0} cal</div>
                      <div>🥩 {recipe.macronutrients?.proteins || 0}g protein</div>
                      <div>🍞 {recipe.macronutrients?.carbohydrates || 0}g carbs</div>
                      <div>🥑 {recipe.macronutrients?.fats || 0}g fats</div>
                    </div>
                  </div>

                  {/* Category */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', fontSize: '12px', color: '#666' }}>
                    {recipe.category && (
                      <span
                        style={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px'
                        }}
                      >
                        {recipe.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
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

export default RecipeList;
