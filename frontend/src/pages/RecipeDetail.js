import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { recipesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Download } from 'lucide-react';

const RecipeDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await recipesAPI.getBySlug(slug);
        setRecipe(res.data.recipe);
        setIsFavorite(res.data.isFavorite || false);
      } catch (error) {
        console.error('Failed to load recipe:', error);
        toast.error('Recipe not found');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [slug]);

  const handleDownloadPdf = async () => {
    try {
      const res = await recipesAPI.downloadPdf(slug);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (recipe?.slug || slug || 'recipe').toLowerCase();
      a.download = `${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download recipe PDF');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please login to add favorites');
      return;
    }

    try {
      const res = await recipesAPI.toggleFavorite(recipe._id);
      setIsFavorite(res.data.isFavorite);
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Recipe not found</h2>
          <Link to="/recipes" className="btn btn-primary">Back to Recipes</Link>
        </div>
      </div>
    );
  }

  const safeUrl = recipe.image && (recipe.image.startsWith('http://') || recipe.image.startsWith('https://') || recipe.image.startsWith('/')) ? recipe.image : '';

  return (
    <div className="container">
      <div className="section-header" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/recipes" className="btn btn-secondary">← Back to Recipes</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleDownloadPdf} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} />
            Download as PDF
          </button>
          {user && (
            <button
              onClick={toggleFavorite}
              className={`btn ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Image and basic info */}
          <div>
            {safeUrl ? (
              <img
                src={safeUrl}
                alt={recipe.name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/500x400?text=Recipe+Image'; }}
                style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
              />
            ) : (
              <img
                src={'https://via.placeholder.com/500x400?text=No+image'}
                alt="no image"
                style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
              />
            )}
          </div>

          {/* Recipe details (right column) */}
          <div>
            <h1 style={{ marginBottom: '16px', fontSize: '28px', fontWeight: 'bold' }}>{recipe.name}</h1>

            {/* Macronutrients */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Nutrition Facts</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🔥 Calories:</span>
                  <strong>{recipe.macronutrients?.calories || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🥩 Protein:</span>
                  <strong>{recipe.macronutrients?.proteins || 0}g</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🍞 Carbs:</span>
                  <strong>{recipe.macronutrients?.carbohydrates || 0}g</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🥑 Fats:</span>
                  <strong>{recipe.macronutrients?.fats || 0}g</strong>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Ingredients</h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                {recipe.ingredients?.map((ingredient, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <strong>{ingredient.quantity}</strong>
                    <span> {ingredient.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Category (name only) */}
            {recipe.category && (
              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {recipe.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions full width below grid */}
        {recipe.instructions && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Instructions</h3>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.6',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {recipe.instructions}
            </div>
          </div>
        )}
        {/* Author info */}
        {recipe.author && (
          <div style={{ 
            marginTop: '32px', 
            paddingTop: '16px', 
            borderTop: '1px solid #eee',
            fontSize: '14px',
            color: '#666'
          }}>
            Recipe by <strong>{recipe.author.fullName}</strong>
            {recipe.publishedAt && (
              <span> • Published {new Date(recipe.publishedAt).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;
