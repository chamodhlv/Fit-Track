import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workoutsAPI } from '../services/api';
import { Plus, Calendar, Clock, Dumbbell, Edit, Trash2, Activity, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-based
  const [calendarDays, setCalendarDays] = useState([]); // [{date: 'YYYY-MM-DD', count: number}]
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);

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

  // Fetch calendar days when month/year changes
  useEffect(() => {
    const fetchCalendar = async () => {
      setCalendarLoading(true);
      try {
        const year = calYear;
        const month1based = calMonth + 1;
        const { data } = await workoutsAPI.getHistoryCalendar(year, month1based);
        setCalendarDays(data.days || []);
      } catch (e) {
        toast.error('Failed to load workout calendar');
      } finally {
        setCalendarLoading(false);
      }
    };
    fetchCalendar();
  }, [calYear, calMonth]);

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
        // Refresh calendar as counts may change
        const year = calYear;
        const month1based = calMonth + 1;
        try {
          const { data } = await workoutsAPI.getHistoryCalendar(year, month1based);
          setCalendarDays(data.days || []);
        } catch {}
      } catch (error) {
        toast.error('Failed to delete workout');
      }
    }
  };

  const handleMarkCompleted = async (workout) => {
    try {
      // Mark completion for TODAY (local day normalized to UTC midnight)
      const tISO = todayUTCISO();
      await workoutsAPI.markCompleted(workout._id); // backend defaults to now
      toast.success('Marked as completed');
      // Update workouts list locally
      setWorkouts(prev => prev.map(w => {
        if (w._id !== workout._id) return w;
        const newComps = Array.isArray(w.completions) ? [...w.completions] : [];
        if (!newComps.some(c => sameUTCDay(c, tISO))) newComps.push(tISO);
        return { ...w, completed: true, completedAt: tISO, completions: newComps };
      }));
      // Ensure calendar shows the workout's month and refresh
      const d = new Date(tISO);
      const y = d.getUTCFullYear();
      const m0 = d.getUTCMonth();
      setCalYear(y);
      setCalMonth(m0);
      const { data } = await workoutsAPI.getHistoryCalendar(y, m0 + 1);
      setCalendarDays(data.days || []);
      // If selected date is open and matches, refresh its list
      const sel = selectedDate;
      if (sel && sameUTCDay(sel, tISO)) {
        const res = await workoutsAPI.getHistoryByDate(sel.substring(0, 10));
        setSelectedDateWorkouts(res.data.workouts || []);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to mark as completed';
      toast.error(msg);
    }
  };

  const handleUncomplete = async (workout) => {
    try {
      const tISO = todayUTCISO();
      await workoutsAPI.uncomplete(workout._id, tISO);
      toast.success('Unmarked completion');
      setWorkouts(prev => prev.map(w => {
        if (w._id !== workout._id) return w;
        const newComps = (w.completions || []).filter(c => !sameUTCDay(c, tISO));
        const noComps = newComps.length === 0;
        return { ...w, completions: newComps, completed: noComps ? false : w.completed, completedAt: noComps ? null : w.completedAt };
      }));
      // Ensure calendar shows the workout's month and refresh
      const d = new Date(tISO);
      const y = d.getUTCFullYear();
      const m0 = d.getUTCMonth();
      setCalYear(y);
      setCalMonth(m0);
      const { data } = await workoutsAPI.getHistoryCalendar(y, m0 + 1);
      setCalendarDays(data.days || []);
      // If selected date is open and matches, refresh its list
      const sel = selectedDate;
      if (sel && sameUTCDay(sel, tISO)) {
        const res = await workoutsAPI.getHistoryByDate(sel.substring(0, 10));
        setSelectedDateWorkouts(res.data.workouts || []);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to unmark completion';
      toast.error(msg);
    }
  };

  const openDateDetails = async (isoDate) => {
    setSelectedDate(isoDate);
    setDateLoading(true);
    try {
      const { data } = await workoutsAPI.getHistoryByDate(isoDate);
      setSelectedDateWorkouts(data.workouts || []);
    } catch (e) {
      toast.error('Failed to load workouts for selected date');
    } finally {
      setDateLoading(false);
    }
  };

  const closeDateDetails = () => {
    setSelectedDate(null);
    setSelectedDateWorkouts([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helpers for calendar rendering
  const getMonthLabel = (y, m0) => new Date(y, m0, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = (y, m0) => new Date(y, m0 + 1, 0).getDate();
  const firstWeekday = (y, m0) => new Date(y, m0, 1).getDay(); // 0 Sun - 6 Sat (local)
  const pad2 = (n) => String(n).padStart(2, '0');
  const isoday = (y, m0, d) => `${y}-${pad2(m0 + 1)}-${pad2(d)}`;
  const completedMap = Object.fromEntries(calendarDays.map(d => [d.date, d.count]));

  // Helpers for completion toggling (use UTC day normalization to match backend)
  const toUTCISODate = (dateLike) => {
    const dt = new Date(dateLike);
    const day = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
    return day.toISOString();
  };
  const todayUTCISO = () => {
    const now = new Date();
    const day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    return day.toISOString();
  };
  const sameUTCDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth() && da.getUTCDate() === db.getUTCDate();
  };
  const isCompletedForToday = (workout) => {
    const tISO = todayUTCISO();
    if (Array.isArray(workout.completions) && workout.completions.some(c => sameUTCDay(c, tISO))) return true;
    if (workout.completed && workout.completedAt && sameUTCDay(workout.completedAt, tISO)) return true;
    return false;
  };

  const prevMonth = () => {
    const date = new Date(calYear, calMonth, 1);
    date.setMonth(date.getMonth() - 1);
    setCalYear(date.getFullYear());
    setCalMonth(date.getMonth());
  };
  const nextMonth = () => {
    const date = new Date(calYear, calMonth, 1);
    date.setMonth(date.getMonth() + 1);
    setCalYear(date.getFullYear());
    setCalMonth(date.getMonth());
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

        {/* Workout History Calendar */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <Calendar size={20} style={{ marginRight: '8px' }} />
              Workout History
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={prevMonth} title="Previous Month" style={{ padding: '6px 8px' }}>
                <ChevronLeft size={16} />
              </button>
              <div style={{ minWidth: 160, textAlign: 'center', fontWeight: 600 }}>{getMonthLabel(calYear, calMonth)}</div>
              <button className="btn btn-secondary" onClick={nextMonth} title="Next Month" style={{ padding: '6px 8px' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>{d}</div>
            ))}
            {/* Leading blanks */}
            {Array.from({ length: firstWeekday(calYear, calMonth) }).map((_, i) => (
              <div key={`b-${i}`} />
            ))}
            {/* Days */}
            {Array.from({ length: daysInMonth(calYear, calMonth) }, (_, i) => i + 1).map(day => {
              const iso = isoday(calYear, calMonth, day);
              const count = completedMap[iso] || 0;
              const isToday = iso === isoday(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <button
                  key={iso}
                  onClick={() => count > 0 ? openDateDetails(iso) : null}
                  className="btn"
                  style={{
                    padding: '10px 6px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: count > 0 ? '#ecfeff' : 'white',
                    color: '#111827',
                    cursor: count > 0 ? 'pointer' : 'default',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 600, color: isToday ? '#2563eb' : undefined }}>{day}</div>
                  {count > 0 && (
                    <div style={{ fontSize: 12, color: '#0ea5e9' }}>{count} completed</div>
                  )}
                </button>
              );
            })}
          </div>

          {calendarLoading && (
            <div style={{ marginTop: '0.75rem' }} className="loading"><div className="spinner"></div></div>
          )}

          {/* Selected date details */}
          {selectedDate && (
            <div className="card" style={{ marginTop: '1rem', background: '#f9fafb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0 }}>Completed on {selectedDate}</h4>
                <button className="btn btn-secondary" onClick={closeDateDetails}>Close</button>
              </div>
              {dateLoading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : selectedDateWorkouts.length === 0 ? (
                <p style={{ marginTop: '0.5rem' }}>No workouts found.</p>
              ) : (
                <div style={{ marginTop: '0.75rem' }}>
                  {selectedDateWorkouts.map(w => (
                    <div
                      key={w._id}
                      className="workout-item"
                      style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        background: '#ffffff',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div className="workout-header" style={{ alignItems: 'center' }}>
                        <div>
                          <div className="workout-title" style={{ fontSize: '1rem' }}>{w.title}</div>
                          <div
                            className="workout-date"
                            style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}
                          >
                            <Clock size={14} style={{ marginRight: 4 }} /> {w.totalDuration || 0} min
                            <span style={{ marginLeft: 8, padding: '2px 8px', backgroundColor: '#e5e7eb', borderRadius: 12, fontSize: '0.8rem', textTransform: 'capitalize' }}>{w.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                      {isCompletedForToday(workout) && (
                        <span style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', color: '#16a34a', fontWeight: 600 }}>
                          <CheckCircle2 size={16} style={{ marginRight: 4 }} /> Completed Today
                        </span>
                      )}
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
                    {isCompletedForToday(workout) ? (
                      <button
                        onClick={() => handleUncomplete(workout)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        title="Unmark Completion"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkCompleted(workout)}
                        className="btn btn-primary"
                        style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        title="Mark as Completed Today"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
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
