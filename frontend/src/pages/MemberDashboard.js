import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workoutsAPI } from '../services/api';
import { Plus, Calendar, Clock, Dumbbell, Edit, Trash2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const MemberDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    age: user?.age || '',
    weight: user?.weight || '',
    height: user?.height || '',
    fitnessGoal: user?.fitnessGoal || 'weight loss',
    experienceLevel: user?.experienceLevel || 'beginner',
  });

  useEffect(() => {
    fetchWorkouts();
  }, [currentPage]);

  const fetchWorkouts = async () => {
    try {
      const response = await workoutsAPI.getWorkouts(currentPage, 5);
      setWorkouts(response.data.workouts);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch workouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // keep profile form in sync when user changes
    setProfileForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      age: user?.age || '',
      weight: user?.weight || '',
      height: user?.height || '',
      fitnessGoal: user?.fitnessGoal || 'weight loss',
      experienceLevel: user?.experienceLevel || 'beginner',
    });
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...profileForm,
      age: profileForm.age ? parseInt(profileForm.age, 10) : undefined,
      weight: profileForm.weight ? parseFloat(profileForm.weight) : undefined,
      height: profileForm.height ? parseFloat(profileForm.height) : undefined,
    };
    await updateProfile(payload);
    setEditing(false);
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await workoutsAPI.deleteWorkout(workoutId);
        toast.success('Workout deleted successfully');
        fetchWorkouts();
      } catch (error) {
        toast.error('Failed to delete workout');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome back, {user?.fullName}!</h1>
        </div>

        {/* Stats removed as requested */}

        {/* User Profile Card */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <Activity size={20} style={{ marginRight: '8px' }} />
            Your Profile
          </h3>
          {!editing ? (
            <>
              <div className="grid grid-2">
                <div>
                  <p><strong>Full Name:</strong> {user?.fullName}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Age:</strong> {user?.age} years</p>
                </div>
                <div>
                  <p><strong>Weight:</strong> {user?.weight} kg</p>
                  <p><strong>Height:</strong> {user?.height} cm</p>
                  <p><strong>Fitness Goal:</strong> {user?.fitnessGoal}</p>
                  <p><strong>Experience Level:</strong> {user?.experienceLevel}</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleProfileSubmit} className="modal-body" style={{ padding: 0 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="form-input" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="form-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" min="13" max="100" value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    className="form-input" />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" min="30" max="300" value={profileForm.weight}
                    onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })}
                    className="form-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input type="number" min="100" max="250" value={profileForm.height}
                    onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                    className="form-input" />
                </div>
                <div className="form-group">
                  <label>Fitness Goal</label>
                  <select value={profileForm.fitnessGoal}
                    onChange={(e) => setProfileForm({ ...profileForm, fitnessGoal: e.target.value })}
                    className="form-select">
                    <option value="weight loss">Weight Loss</option>
                    <option value="muscle gain">Muscle Gain</option>
                    <option value="endurance">Endurance</option>
                    <option value="flexibility">Flexibility</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Experience Level</label>
                  <select value={profileForm.experienceLevel}
                    onChange={(e) => setProfileForm({ ...profileForm, experienceLevel: e.target.value })}
                    className="form-select">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          )}
        </div>

        {/* Workouts Section */}
        <div className="section-header">
          <h2 className="section-title">Your Workout Logs</h2>
          <Link to="/workout/new" className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '8px' }} />
            Add Workout
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div className="card text-center">
            <Dumbbell size={48} style={{ margin: '0 auto 1rem', color: '#ccc' }} />
            <h3>No workouts yet</h3>
            <p>Start your fitness journey by logging your first workout!</p>
            <Link to="/workout/new" className="btn btn-primary mt-4">
              <Plus size={16} style={{ marginRight: '8px' }} />
              Log Your First Workout
            </Link>
          </div>
        ) : (
          <>
            {workouts.map((workout) => (
              <div key={workout._id} className="workout-item">
                <div className="workout-header">
                  <div>
                    <h3 className="workout-title">{workout.title}</h3>
                    <div className="workout-date">
                      <Calendar size={14} style={{ marginRight: '4px' }} />
                      {formatDate(workout.date)}
                      {workout.totalDuration > 0 && (
                        <>
                          <Clock size={14} style={{ marginLeft: '12px', marginRight: '4px' }} />
                          {workout.totalDuration} min
                        </>
                      )}
                      <span style={{ 
                        marginLeft: '12px', 
                        padding: '2px 8px', 
                        backgroundColor: '#e5e7eb', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        textTransform: 'capitalize'
                      }}>
                        {workout.category}
                      </span>
                    </div>
                  </div>
                  <div className="workout-actions">
                    <Link 
                      to={`/workout/edit/${workout._id}`} 
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    >
                      <Edit size={14} />
                    </Link>
                    <button 
                      onClick={() => handleDeleteWorkout(workout._id)}
                      className="btn btn-danger"
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {workout.notes && (
                  <p style={{ color: '#666', marginBottom: '1rem' }}>{workout.notes}</p>
                )}

                <div className="workout-exercises">
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Exercises:</h4>
                  {workout.exercises.map((exercise, index) => (
                    <div key={index} className="exercise-item">
                      <div className="exercise-name">{exercise.name}</div>
                      <div className="exercise-details">
                        {exercise.sets} sets × {exercise.reps} reps
                        {exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                        {exercise.duration > 0 && ` • ${exercise.duration} min`}
                        {exercise.notes && ` • ${exercise.notes}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 'active' : ''}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
