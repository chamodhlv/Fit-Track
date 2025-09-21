import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { recipesAPI } from '../services/api';

const RecipeEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const mode = useMemo(() => (id ? 'edit' : 'create'), [id]);

  const [loading, setLoading] = useState(mode === 'edit');
  const [form, setForm] = useState({
    name: '',
    image: '',
    ingredients: [{ name: '', quantity: '' }],
    macronutrients: {
      calories: '',
      carbohydrates: '',
      proteins: '',
      fats: ''
    },
    category: '',
    instructions: ''
  });

  const availableCategories = [
    'High Protein',
    'Low Calories',
    'Weight Loss',
    'Weight Gain',
    'Healthy Desserts',
    'Vegan'
  ];

  // Load existing recipe for edit
  useEffect(() => {
    const bootstrap = async () => {
      if (mode !== 'edit') return;
      // Prefer state if provided from navigation
      const fromState = location.state?.recipe;
      if (fromState) {
        setForm({
          name: fromState.name || '',
          image: fromState.image || '',
          ingredients: fromState.ingredients?.length ? fromState.ingredients : [{ name: '', quantity: '' }],
          macronutrients: fromState.macronutrients || {
            calories: '',
            carbohydrates: '',
            proteins: '',
            fats: ''
          },
          category: fromState.category || '',
          instructions: fromState.instructions || ''
        });
        setLoading(false);
        return;
      }
      try {
        const res = await recipesAPI.getById(id);
        const r = res.data?.recipe;
        setForm({
          name: r?.name || '',
          image: r?.image || '',
          ingredients: r?.ingredients?.length ? r.ingredients : [{ name: '', quantity: '' }],
          macronutrients: r?.macronutrients || {
            calories: '',
            carbohydrates: '',
            proteins: '',
            fats: ''
          },
          category: r?.category || '',
          instructions: r?.instructions || ''
        });
      } catch (e) {
        toast.error('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [id, location.state, mode]);

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...form.ingredients];
    newIngredients[index][field] = value;
    setForm({ ...form, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setForm({
      ...form,
      ingredients: [...form.ingredients, { name: '', quantity: '' }]
    });
  };

  const removeIngredient = (index) => {
    if (form.ingredients.length > 1) {
      const newIngredients = form.ingredients.filter((_, i) => i !== index);
      setForm({ ...form, ingredients: newIngredients });
    }
  };

  const handleMacroChange = (field, value) => {
    setForm({
      ...form,
      macronutrients: {
        ...form.macronutrients,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.name.trim()) {
      toast.error('Recipe name is required');
      return;
    }
    if (!form.image.trim()) {
      toast.error('Recipe image is required');
      return;
    }
    
    // Validate ingredients
    const validIngredients = form.ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
    if (validIngredients.length === 0) {
      toast.error('At least one ingredient is required');
      return;
    }

    // Validate instructions
    if (!form.instructions.trim()) {
      toast.error('Instructions are required');
      return;
    }

    // Validate macronutrients
    const macros = form.macronutrients;
    if (!macros.calories || !macros.carbohydrates || !macros.proteins || !macros.fats) {
      toast.error('All macronutrient values are required');
      return;
    }

    const payload = {
      name: form.name,
      image: form.image,
      ingredients: validIngredients,
      macronutrients: {
        calories: parseFloat(macros.calories),
        carbohydrates: parseFloat(macros.carbohydrates),
        proteins: parseFloat(macros.proteins),
        fats: parseFloat(macros.fats)
      },
      category: form.category || undefined,
      instructions: form.instructions
    };

    try {
      if (mode === 'edit') {
        await recipesAPI.update(id, payload);
        toast.success('Recipe updated');
      } else {
        await recipesAPI.create(payload);
        toast.success('Recipe created');
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
        <h2 className="section-title">{mode === 'edit' ? 'Edit Recipe' : 'Create Recipe'}</h2>
        <Link to="/admin" className="btn btn-secondary">Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 16 }}>
        <div className="form-group">
          <label>Recipe Name * (max 150 characters)</label>
          <input
            type="text"
            required
            maxLength="150"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="form-input"
            placeholder="Enter recipe name"
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {form.name.length}/150 characters
          </div>
        </div>

        <div className="form-group">
          <label>Recipe Image *</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="form-input"
              placeholder="Enter image URL or upload file below"
              style={{ flex: 1 }}
            />
            <span style={{ color: '#666' }}>OR</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setForm({ ...form, image: event.target.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{ width: '200px' }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            You can either enter an image URL or upload an image file from your computer
          </div>
        </div>

        {form.image && (
          <img
            src={form.image}
            alt="recipe preview"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Preview+not+available'; }}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
          />
        )}

        <div className="form-group">
          <label>Ingredients *</label>
          {form.ingredients.map((ingredient, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                className="form-input"
                style={{ flex: 2 }}
              />
              <input
                type="text"
                placeholder="Quantity (e.g., 2 cups, 1 tbsp)"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              {form.ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="btn btn-secondary"
            style={{ marginTop: '8px' }}
          >
            Add Ingredient
          </button>
        </div>

        <div className="form-group">
          <label>Macronutrients *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Calories</label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={form.macronutrients.calories}
                onChange={(e) => handleMacroChange('calories', e.target.value)}
                className="form-input"
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Carbohydrates (g)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={form.macronutrients.carbohydrates}
                onChange={(e) => handleMacroChange('carbohydrates', e.target.value)}
                className="form-input"
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Proteins (g)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={form.macronutrients.proteins}
                onChange={(e) => handleMacroChange('proteins', e.target.value)}
                className="form-input"
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Fats (g)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={form.macronutrients.fats}
                onChange={(e) => handleMacroChange('fats', e.target.value)}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Category (optional)</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="form-input"
          >
            <option value="">Select a category</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Instructions *</label>
          <textarea
            required
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className="form-input"
            placeholder="Enter detailed cooking instructions..."
            rows={6}
          />
        </div>


        <div className="modal-footer" style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin')}>Cancel</button>
          <button type="submit" className="btn btn-primary">{mode === 'edit' ? 'Save Changes' : 'Create Recipe'}</button>
        </div>
      </form>
    </div>
  );
};

export default RecipeEditor;
