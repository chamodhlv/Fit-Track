import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutsAPI } from '../services/api';
import { Plus, Minus, Calendar, Clock, FileText, Dumbbell } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkoutForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    exercises: [
      {
        name: '',
        sets: 1,
        reps: 1,
        weight: '',
        duration: '',
        notes: ''
      }
    ],
    totalDuration: '',
    notes: '',
    category: 'mixed'
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchWorkout();
    }
  }, [id, isEditing]);

  const fetchWorkout = async () => {
    try {
      const response = await workoutsAPI.getWorkout(id);
      const workout = response.data.workout;
      setFormData({
        title: workout.title,
        date: new Date(workout.date).toISOString().split('T')[0],
        exercises: (workout.exercises && workout.exercises.length > 0
          ? workout.exercises.map(ex => ({
              name: ex.name || '',
              sets: ex.sets ?? 1,
              reps: ex.reps ?? 1,
              weight: ex.weight ? ex.weight : '',
              duration: ex.duration ? ex.duration : '',
              notes: ex.notes || ''
            }))
          : [
              { name: '', sets: 1, reps: 1, weight: '', duration: '', notes: '' }
            ]
        ),
        totalDuration: workout.totalDuration ? workout.totalDuration : '',
        notes: workout.notes || '',
        category: workout.category || 'mixed'
      });
    } catch (error) {
      toast.error('Failed to fetch workout');
      navigate('/dashboard');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalDuration') {
      // Allow empty while typing
      const next = value === '' ? '' : Number(value);
      setFormData(prev => ({ ...prev, [name]: next }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleExerciseChange = (index, field, value) => {
    const updatedExercises = [...formData.exercises];
    const numericFields = ['sets', 'reps', 'weight', 'duration'];
    let nextVal = value;
    if (numericFields.includes(field)) {
      // Allow empty while typing; otherwise coerce to number
      nextVal = value === '' ? '' : Number(value);
    } else {
      nextVal = value;
    }
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: nextVal,
    };
    setFormData(prev => ({
      ...prev,
      exercises: updatedExercises
    }));
  };

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: '',
          sets: 1,
          reps: 1,
          weight: '',
          duration: '',
          notes: ''
        }
      ]
    }));
  };

  const removeExercise = (index) => {
    if (formData.exercises.length > 1) {
      const updatedExercises = formData.exercises.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        exercises: updatedExercises
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (!formData.title.trim()) {
      toast.error('Please enter a workout title');
      setLoading(false);
      return;
    }

    const validExercises = formData.exercises.filter(ex => ex.name.trim());
    if (validExercises.length === 0) {
      toast.error('Please add at least one exercise');
      setLoading(false);
      return;
    }

    // Normalize numeric fields before sending
    const normalizedExercises = validExercises.map(ex => ({
      name: ex.name,
      sets: Number(ex.sets) || 1,
      reps: Number(ex.reps) || 1,
      weight: Number(ex.weight) || 0,
      duration: Number(ex.duration) || 0,
      notes: ex.notes || ''
    }));

    const workoutData = {
      ...formData,
      exercises: normalizedExercises
    };

    // Prevent past dates: formData.date must be today or in the future
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (workoutData.date && workoutData.date < todayStr) {
        toast.error('Please select today or a future date');
        setLoading(false);
        return;
      }
    } catch {}

    try {
      if (isEditing) {
        await workoutsAPI.updateWorkout(id, workoutData);
        toast.success('Workout updated successfully');
      } else {
        await workoutsAPI.createWorkout(workoutData);
        toast.success('Workout created successfully');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update workout' : 'Failed to create workout');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h1 className="form-title">
        <Dumbbell size={24} style={{ marginRight: '8px' }} />
        {isEditing ? 'Edit Workout' : 'Log New Workout'}
      </h1>

      <form onSubmit={handleSubmit} className="card">
        {/* Basic Workout Info */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Workout Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Upper Body Strength Training"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="mixed">Mixed</option>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="flexibility">Flexibility</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Clock size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Total Duration (minutes)
            </label>
            <input
              type="number"
              name="totalDuration"
              value={formData.totalDuration}
              onChange={handleInputChange}
              className="form-input"
              min="0"
              placeholder="0"
              onFocus={(e) => e.target.select()}
            />
          </div>
        </div>

        {/* Exercises Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <Dumbbell size={20} style={{ marginRight: '8px' }} />
            Exercises
          </h3>

          {formData.exercises.map((exercise, index) => (
            <div key={index} className="exercise-form">
              <div className="exercise-header">
                <h4 className="exercise-title">Exercise {index + 1}</h4>
                {formData.exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="remove-exercise-btn"
                  >
                    <Minus size={12} />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Exercise Name</label>
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Bench Press, Push-ups, Running"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sets</label>
                  <input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                    className="form-input"
                    min="1"
                    onFocus={(e) => e.target.select()}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reps</label>
                  <input
                    type="number"
                    value={exercise.reps}
                    onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                    className="form-input"
                    min="1"
                    onFocus={(e) => e.target.select()}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    value={exercise.weight}
                    onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                    className="form-input"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input
                    type="number"
                    value={exercise.duration}
                    onChange={(e) => handleExerciseChange(index, 'duration', e.target.value)}
                    className="form-input"
                    min="0"
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exercise Notes (optional)</label>
                <input
                  type="text"
                  value={exercise.notes}
                  onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Felt strong today, increase weight next time"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addExercise}
            className="add-exercise-btn"
          >
            <Plus size={16} style={{ marginRight: '8px' }} />
            Add Exercise
          </button>
        </div>

        {/* Workout Notes */}
        <div className="form-group">
          <label className="form-label">Workout Notes (optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="form-input"
            rows="3"
            placeholder="How did the workout feel? Any observations or goals for next time?"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Workout' : 'Save Workout')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutForm;
