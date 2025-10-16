import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Edit, 
  Award, 
  DollarSign, 
  Calendar, 
  Clock,
  Camera,
  FileText,
  Activity,
  BookOpen,
  ChefHat,
  Plus,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { recipesAPI, blogsAPI, bookingsAPI, usersAPI } from '../services/api';

const TrainerDashboard = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    bio: '',
    specialties: [],
    sessionRate: '',
    availability: {
      timeSlots: [{ start: '', end: '' }]
    },
    profileImage: ''
  });

  // Sidebar active section
  const [activeSection, setActiveSection] = useState('clients');

  // State for recipe and blog management
  const [recipes, setRecipes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [recipeLoading, setRecipeLoading] = useState(true);
  const [blogLoading, setBlogLoading] = useState(true);
  const [recipeCurrentPage, setRecipeCurrentPage] = useState(1);
  const [recipeTotalPages, setRecipeTotalPages] = useState(1);
  const [blogCurrentPage, setBlogCurrentPage] = useState(1);
  const [blogTotalPages, setBlogTotalPages] = useState(1);

  // My Clients (Bookings) - calendar and list
  const today = new Date();
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const yearOptions = Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendarCounts, setCalendarCounts] = useState({});
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const specialtyOptions = [
    'Weight Loss',
    'Strength Training', 
    'Yoga Instructor',
    'Bodybuilding'
  ];


  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        bio: user.bio || '',
        specialties: user.specialties || [],
        sessionRate: user.sessionRate || '',
        availability: {
          timeSlots: user.availability?.timeSlots || [{ start: '', end: '' }]
        },
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);

  // Fetch recipes when Recipes section is active
  useEffect(() => {
    if (activeSection === 'recipes') {
      fetchRecipes();
    }
  }, [recipeCurrentPage, activeSection]);

  // Fetch posts when Blogs section is active
  useEffect(() => {
    if (activeSection === 'blogs') {
      fetchPosts();
    }
  }, [blogCurrentPage, activeSection]);

  // AbortControllers for requests
  const calendarCtrlRef = useRef(null);
  const clientsCtrlRef = useRef(null);

  // Load calendar counts only when Clients section is active
  useEffect(() => {
    if (user?.role !== 'trainer' || activeSection !== 'clients') return;
    // cancel any in-flight calendar request
    if (calendarCtrlRef.current) {
      calendarCtrlRef.current.abort();
    }
    const ctrl = new AbortController();
    calendarCtrlRef.current = ctrl;
    loadCalendar(ctrl.signal);
    return () => {
      ctrl.abort();
      if (calendarCtrlRef.current === ctrl) calendarCtrlRef.current = null;
    };
  }, [calYear, calMonth, user, activeSection]);

  const fetchRecipes = async () => {
    try {
      setRecipeLoading(true);
      const response = await recipesAPI.getMyRecipes(recipeCurrentPage, 5, null);
      setRecipes(response.data.recipes);
      setRecipeTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to load your recipes');
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    console.log('[TrainerDashboard] Delete Account clicked');
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;
    try {
      const loadingId = toast.loading('Deleting your account...');
      await usersAPI.deleteMe();
      toast.dismiss(loadingId);
      toast.success('Account deleted successfully');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('[TrainerDashboard] Delete account failed', error);
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || (status ? `Failed to delete account (status ${status})` : 'Failed to delete account. Please contact an administrator.');
      toast.error(msg);
    }
  };

  const loadCalendar = async (signal) => {
    try {
      const { data } = await bookingsAPI.myClientsCalendar(calYear, calMonth, { signal });
      setCalendarCounts(data.counts || {});
    } catch (e) {
      if (e?.code !== 'ERR_CANCELED') {
        console.error('Calendar load error', e);
      }
    }
  };

  const loadClientsByDate = async (dateStr) => {
    try {
      // cancel previous request if any
      if (clientsCtrlRef.current) {
        clientsCtrlRef.current.abort();
      }
      const ctrl = new AbortController();
      clientsCtrlRef.current = ctrl;
      setClientsLoading(true);
      setSelectedDate(dateStr);
      const { data } = await bookingsAPI.myClientsByDate(dateStr, { signal: ctrl.signal });
      setClients(data.clients || []);
    } catch (e) {
      if (e?.code !== 'ERR_CANCELED') {
        toast.error('Failed to load clients for selected date');
      }
    } finally {
      setClientsLoading(false);
      // clear ref if it's our controller
      if (clientsCtrlRef.current && clientsCtrlRef.current.signal.aborted) {
        clientsCtrlRef.current = null;
      }
    }
  };

  const fetchPosts = async () => {
    try {
      setBlogLoading(true);
      const response = await blogsAPI.getMyPosts(blogCurrentPage, 5, null);
      setPosts(response.data.posts);
      setBlogTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast.error('Failed to load your blog posts');
    } finally {
      setBlogLoading(false);
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await recipesAPI.remove(id);
        toast.success('Recipe deleted successfully');
        fetchRecipes(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete recipe');
      }
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await blogsAPI.remove(id);
        toast.success('Blog post deleted successfully');
        fetchPosts(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete blog post');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'status-badge draft', text: 'Draft' },
      published: { class: 'status-badge published', text: 'Published' }
    };
    const badge = badges[status] || badges.draft;
    return <span className={badge.class}>{badge.text}</span>;
  };

  const truncateContent = (content, maxLength = 80) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'specialties') {
      if (checked) {
        setProfileForm(prev => ({
          ...prev,
          specialties: [...prev.specialties, value]
        }));
      } else {
        setProfileForm(prev => ({
          ...prev,
          specialties: prev.specialties.filter(s => s !== value)
        }));
      }
    } else {
      setProfileForm({
        ...profileForm,
        [name]: value,
      });
    }
  };

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...profileForm.availability.timeSlots];
    newTimeSlots[index][field] = value;
    setProfileForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: newTimeSlots
      }
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // 2 MB client-side limit to prevent oversized uploads
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Please upload an image smaller than 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (profileForm.specialties.length === 0) {
      toast.error("Please select at least one specialty");
      return;
    }


    if (profileForm.availability.timeSlots.some(slot => !slot.start || !slot.end)) {
      toast.error("Please fill in all time slots");
      return;
    }

    // Validate bio min length
    if (!profileForm.bio || profileForm.bio.trim().length < 10) {
      toast.error('Bio must be at least 10 characters');
      return;
    }

    // Validate session rate
    const rate = parseFloat(profileForm.sessionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 5000) {
      toast.error('Please enter a valid session rate (0–5000)');
      return;
    }

    try {
      const payload = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        bio: profileForm.bio,
        specialties: profileForm.specialties,
        sessionRate: rate,
        availability: profileForm.availability,
        profileImage: profileForm.profileImage
      };

      const result = await updateProfile(payload);
      if (result?.success) {
        // AuthContext already updates user and localStorage + shows toast
        setEditing(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Trainer Panel</div>
          <div className="sidebar-subtitle">Welcome, {user?.fullName}</div>
        </div>
        <nav className="sidebar-menu">
          <button className={`menu-btn ${activeSection === 'clients' ? 'active' : ''}`} onClick={() => setActiveSection('clients')}>
            <Calendar size={18} />
            <span>My Clients</span>
          </button>
          <button className={`menu-btn ${activeSection === 'blogs' ? 'active' : ''}`} onClick={() => setActiveSection('blogs')}>
            <BookOpen size={18} />
            <span>Blog Posts Management</span>
          </button>
          <button className={`menu-btn ${activeSection === 'recipes' ? 'active' : ''}`} onClick={() => setActiveSection('recipes')}>
            <ChefHat size={18} />
            <span>Recipes Management</span>
          </button>
          <button className={`menu-btn ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>
            <User size={18} />
            <span>Profile Management</span>
          </button>
        </nav>
      </aside>
      <div className="dashboard admin-content">
        <div className="container">

        {/* Profile Management */}
        {activeSection === 'profile' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <Activity size={20} style={{ marginRight: '8px' }} />
            Profile Management
          </h3>
          {!editing ? (
            <>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Image on the left */}
                <div>
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={32} color="#999" />
                    </div>
                  )}
                </div>

                {/* Details box on the right */}
                <div style={{ flex: 1, paddingLeft: '1rem' }}>
                  <div className="grid grid-2">
                    <div>
                      <p><strong>Full Name:</strong> {user?.fullName}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Session Rate:</strong> LKR {user?.sessionRate}/Per Session</p>
                    </div>
                    <div>
                      <p><strong>Specialties:</strong></p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', marginTop: '0.25rem' }}>
                        {user?.specialties?.map(specialty => (
                          <span key={specialty} className="specialty-tag">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
              {/* Full-width Bio and Time Slot aligned to image left */}
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Bio:</strong> {user?.bio || 'No bio provided'}</p>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Time Slot:</strong></p>
                {user?.availability?.timeSlots?.map((slot, index) => (
                  <div key={index} className="time-slot">
                    {slot.start} - {slot.end}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleProfileSubmit} className="modal-body" style={{ padding: 0 }}>
              <div className="form-group">
                <label>Profile Image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" />
                {profileForm.profileImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={profileForm.profileImage} alt="Preview" style={{ maxWidth: '100px', borderRadius: '8px' }} />
                  </div>
                )}
              </div>
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="form-input" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Session Rate (LKR per session)</label>
                  <input type="number" min="0" max="5000" step="1" value={profileForm.sessionRate}
                    onChange={(e) => setProfileForm({ ...profileForm, sessionRate: e.target.value })}
                    className="form-input" required />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="form-input" rows="4" style={{ resize: 'vertical' }} required minLength={10} />
              </div>
              <div className="form-group">
                <label>Specialties (Select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {specialtyOptions.map(specialty => (
                    <label key={specialty} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="specialties"
                        value={specialty}
                        checked={profileForm.specialties.includes(specialty)}
                        onChange={handleChange}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {specialty}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Time Slot</label>
                {profileForm.availability.timeSlots.map((slot, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                      className="form-input"
                      required
                      style={{ flex: 1 }}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                      className="form-input"
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer" style={{ paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          )}
        </div>
        )}

        {/* Blog Posts Management */}
        {activeSection === 'blogs' && (
        <div className="content-management-section" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <BookOpen size={24} style={{ marginRight: '8px' }} />
              Blog Posts Management
            </h2>
            <Link to="/trainer/blogs/new" className="btn btn-primary">
              <Plus size={16} style={{ marginRight: '4px' }} />
              Create Post
            </Link>
          </div>
          <div className="card">
            {blogLoading ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Content</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.length > 0 ? posts.map(post => (
                      <tr key={post._id}>
                        <td>{post.title}</td>
                        <td>{truncateContent(post.content)}</td>
                        <td>{getStatusBadge(post.status)}</td>
                        <td>
                          <div className="action-buttons">
                            <Link to={`/trainer/blogs/${post._id}/edit`} className="btn btn-sm btn-primary" title="Edit"><Edit size={16} /></Link>
                            <button onClick={() => handleDeletePost(post._id)} className="btn btn-sm btn-danger" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center">No blog posts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {blogTotalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setBlogCurrentPage(p => Math.max(p - 1, 1))} disabled={blogCurrentPage === 1}>Previous</button>
                <span>Page {blogCurrentPage} of {blogTotalPages}</span>
                <button onClick={() => setBlogCurrentPage(p => Math.min(p + 1, blogTotalPages))} disabled={blogCurrentPage === blogTotalPages}>Next</button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Recipes Management */}
        {activeSection === 'recipes' && (
        <div className="content-management-section" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <ChefHat size={24} style={{ marginRight: '8px' }} />
              Recipes Management
            </h2>
            <Link to="/trainer/recipes/new" className="btn btn-primary">
              <Plus size={16} style={{ marginRight: '4px' }} />
              Create Recipe
            </Link>
          </div>
          <div className="card">
            {recipeLoading ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recipe</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.length > 0 ? recipes.map(recipe => (
                      <tr key={recipe._id}>
                        <td>{recipe.name}</td>
                        <td><span className="category-tag">{recipe.category}</span></td>
                        <td>{getStatusBadge(recipe.status)}</td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <Link to={`/trainer/recipes/${recipe._id}/edit`} className="btn btn-sm btn-primary" title="Edit"><Edit size={16} /></Link>
                            <button onClick={() => handleDeleteRecipe(recipe._id)} className="btn btn-sm btn-danger" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center">No recipes found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {recipeTotalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setRecipeCurrentPage(p => Math.max(p - 1, 1))} disabled={recipeCurrentPage === 1}>Previous</button>
                <span>Page {recipeCurrentPage} of {recipeTotalPages}</span>
                <button onClick={() => setRecipeCurrentPage(p => Math.min(p + 1, recipeTotalPages))} disabled={recipeCurrentPage === recipeTotalPages}>Next</button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* My Clients - Calendar & List */}
        {activeSection === 'clients' && (
        <div className="content-management-section" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <Calendar size={24} style={{ marginRight: '8px' }} />
              My Clients
            </h2>
            <div className="calendar-controls">
              <select
                className="pill-select"
                value={calMonth}
                onChange={(e) => setCalMonth(parseInt(e.target.value))}
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>
              <select
                className="pill-select"
                value={calYear}
                onChange={(e) => setCalYear(parseInt(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            {/* Simple calendar grid for the selected month */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {(() => {
                const first = new Date(calYear, calMonth - 1, 1);
                const last = new Date(calYear, calMonth, 0);
                const daysInMonth = last.getDate();
                const startWeekday = (first.getDay() + 6) % 7; // Mon=0
                const cells = [];
                for (let i = 0; i < startWeekday; i++) cells.push(<div key={`empty-${i}`}></div>);
                for (let d = 1; d <= daysInMonth; d++) {
                  const yyyy = calYear;
                  const mm = String(calMonth).padStart(2, '0');
                  const dd = String(d).padStart(2, '0');
                  const dateStr = `${yyyy}-${mm}-${dd}`;
                  const count = calendarCounts[dateStr] || 0;
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const hasClients = count > 0;
                  let bg = '#fff';
                  if (isToday && hasClients) bg = '#e6ffed'; // current date with clients
                  else if (isToday) bg = '#fff7e6'; // current date
                  else if (hasClients) bg = '#eef7ff'; // any clients
                  const style = {
                    padding: '0.75rem',
                    textAlign: 'left',
                    border: selectedDate === dateStr ? '2px solid #667eea' : '1px solid #eee',
                    backgroundColor: bg,
                    cursor: 'pointer'
                  };
                  cells.push(
                    <button
                      key={dateStr}
                      className="card"
                      onClick={() => loadClientsByDate(dateStr)}
                      style={style}
                    >
                      <div style={{ fontWeight: 600 }}>{d}</div>
                      <div style={{ fontSize: 12, color: hasClients ? '#333' : '#666' }}>{count} clients</div>
                    </button>
                  );
                }
                return cells;
              })()}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Clients on {selectedDate || '—'}</h3>
              {clientsLoading ? (
                <div className="loading"><div className="spinner"/></div>
              ) : clients.length === 0 ? (
                <p>No clients scheduled.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {clients.map(c => (
                    <li key={c.bookingId} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
                      <span>{c.fullName} <span style={{ color: '#777' }}>({c.email})</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default TrainerDashboard;
