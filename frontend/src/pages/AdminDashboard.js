import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, blogsAPI, recipesAPI, eventsAPI } from '../services/api';
import { LayoutDashboard, Users, Edit, Trash2, UserPlus, FileText, Plus, UserCheck, UserX, Clock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEditMember, setShowEditMember] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    fullName: '',
    email: '',
    password: '',
    age: '',
    weight: '',
    height: '',
    fitnessGoal: 'weight loss',
    experienceLevel: 'beginner'
  });

  // Admin sidebar active section
  const [activeSection, setActiveSection] = useState('dashboard');


  // Trainer management state
  const [allTrainersLoading, setAllTrainersLoading] = useState(true);
  const [allTrainers, setAllTrainers] = useState([]);
  const [allTrainersCurrentPage, setAllTrainersCurrentPage] = useState(1);
  const [allTrainersTotalPages, setAllTrainersTotalPages] = useState(1);
  const [trainerStatusFilter, setTrainerStatusFilter] = useState('all');
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showEditTrainer, setShowEditTrainer] = useState(false);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [trainerEditForm, setTrainerEditForm] = useState({
    fullName: '',
    email: '',
    bio: '',
    specialties: [],
    sessionRate: '',
    availability: { timeSlots: [{ start: '', end: '' }] },
    profileImage: ''
  });
  const [newTrainerForm, setNewTrainerForm] = useState({
    fullName: '',
    email: '',
    password: '',
    age: '',
    weight: '',
    height: '',
    fitnessGoal: 'muscle gain',
    experienceLevel: 'advanced',
    bio: '',
    specialties: [],
    sessionRate: '',
    availability: { timeSlots: [{ start: '', end: '' }] },
    profileImage: ''
  });

  // Blog management state
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogCurrentPage, setBlogCurrentPage] = useState(1);
  const [blogTotalPages, setBlogTotalPages] = useState(1);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [blogEditForm, setBlogEditForm] = useState({ title: '', content: '', coverImageUrl: '', categories: [] });
  const [showAddPost, setShowAddPost] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: '', content: '', coverImageUrl: '', categories: [] });

  // Recipe management state
  const [recipeLoading, setRecipeLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [recipeCurrentPage, setRecipeCurrentPage] = useState(1);
  const [recipeTotalPages, setRecipeTotalPages] = useState(1);

  // Events management state
  const [eventsLoading, setEventsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventsCurrentPage, setEventsCurrentPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editEventForm, setEditEventForm] = useState({ name: '', location: '', date: '', time: '', description: '', image: '' });
  const [editEventGuests, setEditEventGuests] = useState([{ name: '', qualification: '' }]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventForm, setNewEventForm] = useState({ name: '', location: '', date: '', time: '', description: '', image: '' });
  const [newEventGuests, setNewEventGuests] = useState([{ name: '', qualification: '' }]);

  // View trainer state
  const [viewingTrainer, setViewingTrainer] = useState(null);
  const [showViewTrainer, setShowViewTrainer] = useState(false);

  const availableCategories = [
    'Strength Training',
    'Yoga & Flexibility',
    'Cardio & Endurance',
    'Weight Loss',
    'Muscle Building',
    'Health & Recovery'
  ];

  const availableRecipeCategories = [
    'High Protein',
    'Low Calories',
    'Weight Loss',
    'Weight Gain',
    'Healthy Desserts',
    'Vegan'
  ];

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);


  useEffect(() => {
    fetchAllTrainers();
  }, [allTrainersCurrentPage, trainerStatusFilter]);

  useEffect(() => {
    fetchBlogPosts();
  }, [blogCurrentPage]);

  useEffect(() => {
    fetchRecipes();
  }, [recipeCurrentPage]);

  useEffect(() => {
    fetchEvents();
  }, [eventsCurrentPage]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers(currentPage, 10);
      setUsers(response.data.users || []);
      setTotalMembers(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };


  // Trainer management functions
  const fetchAllTrainers = async () => {
    try {
      setAllTrainersLoading(true);
      const token = localStorage.getItem('token');
      const statusParam = trainerStatusFilter || 'all';
      const response = await fetch(`/api/users/trainers?page=${allTrainersCurrentPage}&limit=10&status=${encodeURIComponent(statusParam)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setAllTrainers(data.trainers || []);
        setAllTrainersTotalPages(data.totalPages || 1);
      } else {
        toast.error('Failed to fetch trainers');
      }
    } catch (error) {
      toast.error('Failed to fetch trainers');
    } finally {
      setAllTrainersLoading(false);
    }
  };

  const handleEditTrainer = (trainer) => {
    setEditingTrainer(trainer._id);
    setTrainerEditForm({
      fullName: trainer.fullName || '',
      email: trainer.email || '',
      bio: trainer.bio || '',
      specialties: trainer.specialties || [],
      sessionRate: trainer.sessionRate || '',
      availability: trainer.availability || { timeSlots: [{ start: '', end: '' }] },
      profileImage: trainer.profileImage || ''
    });
    setShowEditTrainer(true);
  };

  const handleUpdateTrainer = async (trainerId) => {
    try {
      // Validate single time slot
      const firstSlot = (trainerEditForm.availability?.timeSlots || [])[0] || { start: '', end: '' };
      if (!(firstSlot.start && firstSlot.end)) {
        toast.error('Please set a time slot (start and end) for the trainer');
        return;
      }
      const payload = {
        ...trainerEditForm,
        availability: {
          ...(trainerEditForm.availability || {}),
          timeSlots: [{ start: firstSlot.start, end: firstSlot.end }]
        }
      };
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/trainers/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Trainer updated successfully');
        setEditingTrainer(null);
        setShowEditTrainer(false);
        fetchAllTrainers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update trainer');
      }
    } catch (error) {
      toast.error('Failed to update trainer');
    }
  };

  const handleDeleteTrainer = async (trainerId) => {
    if (window.confirm('Are you sure you want to delete this trainer? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/trainers/${trainerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          toast.success('Trainer deleted successfully');
          fetchAllTrainers();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to delete trainer');
        }
      } catch (error) {
        toast.error('Failed to delete trainer');
      }
    }
  };

  const handleViewTrainer = (trainer) => {
    setViewingTrainer(trainer);
    setShowViewTrainer(true);
  };

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
      // Validate time slots: must have at least one complete slot
      const slots = (newTrainerForm.availability?.timeSlots || []).filter(s => (s.start || '').trim() && (s.end || '').trim());
      if (slots.length < 1) {
        toast.error('Please add at least one time slot (start and end) for the trainer');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/trainers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: newTrainerForm.fullName,
          email: newTrainerForm.email,
          password: newTrainerForm.password,
          // Provide backend-required defaults since we removed these fields from the form
          age: Number(newTrainerForm.age) || 30,
          weight: Number(newTrainerForm.weight) || 70,
          height: Number(newTrainerForm.height) || 170,
          fitnessGoal: newTrainerForm.fitnessGoal || 'muscle gain',
          experienceLevel: newTrainerForm.experienceLevel || 'advanced',
          bio: newTrainerForm.bio,
          specialties: newTrainerForm.specialties,
          sessionRate: Number(newTrainerForm.sessionRate),
          availability: { ...(newTrainerForm.availability || {}), timeSlots: slots },
          profileImage: newTrainerForm.profileImage || '',
          role: 'trainer',
          approvalStatus: 'approved'
        })
      });

      if (response.ok) {
        toast.success('Trainer created successfully');
        setShowAddTrainer(false);
        setNewTrainerForm({
          fullName: '',
          email: '',
          password: '',
          age: '',
          weight: '',
          height: '',
          fitnessGoal: 'muscle gain',
          experienceLevel: 'advanced',
          bio: '',
          specialties: [],
          sessionRate: '',
          availability: { timeSlots: [{ start: '', end: '' }] },
          profileImage: ''
        });
        fetchAllTrainers();
      } else {
        const data = await response.json();
        const message = data.errors ? data.errors.map(err => err.msg).join(', ') : data.message;
        toast.error(message || 'Failed to create trainer');
      }
    } catch (error) {
      toast.error('Failed to create trainer');
    }
  };

  const handleTrainerStatusChange = async (trainerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = newStatus === 'approved' ? 'approve' : 'reject';
      const response = await fetch(`/api/users/trainers/${trainerId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success(`Trainer ${newStatus} successfully`);
        fetchAllTrainers();
      } else {
        const data = await response.json();
        toast.error(data.message || `Failed to ${newStatus} trainer`);
      }
    } catch (error) {
      toast.error(`Failed to ${newStatus} trainer`);
    }
  };

  // Blog posts: list
  const fetchBlogPosts = async () => {
    try {
      setBlogLoading(true);
      const res = await blogsAPI.adminList(blogCurrentPage, 10);
      setBlogPosts(res.data.posts || []);
      setBlogTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch blog posts');
    } finally {
      setBlogLoading(false);
    }
  };

  // Recipes: list
  const fetchRecipes = async () => {
    try {
      setRecipeLoading(true);
      const res = await recipesAPI.adminList(recipeCurrentPage, 10);
      setRecipes(res.data.recipes || []);
      setRecipeTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch recipes');
    } finally {
      setRecipeLoading(false);
    }
  };

  // Events: list
  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const res = await eventsAPI.list(eventsCurrentPage, 10);
      setEvents(res.data.events || []);
      setEventsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setEventsLoading(false);
    }
  };

  // Helpers to parse guests
  const parseGuests = (guestsText) => {
    return (guestsText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, qualification] = line.split(' - ').map((s) => s?.trim() || '');
        return { name, qualification };
      });
  };

  // Events: create
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      // Prevent past dates
      const todayStr = new Date().toISOString().split('T')[0];
      if (newEventForm.date && newEventForm.date < todayStr) {
        toast.error('Please select today or a future date for the event');
        return;
      }
      const payload = {
        name: newEventForm.name,
        location: newEventForm.location,
        date: newEventForm.date,
        time: newEventForm.time,
        guests: newEventGuests
          .filter(g => (g.name || '').trim())
          .map(g => ({ name: g.name.trim(), qualification: (g.qualification || '').trim() })),
        description: newEventForm.description,
        image: newEventForm.image,
      };
      await eventsAPI.create(payload);
      toast.success('Event created successfully');
      setShowAddEvent(false);
      setNewEventForm({ name: '', location: '', date: '', time: '', description: '', image: '' });
      setNewEventGuests([{ name: '', qualification: '' }]);
      if (eventsCurrentPage !== 1) setEventsCurrentPage(1);
      fetchEvents();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to create event';
      toast.error(msg);
    }
  };

  const handleEditEvent = (ev) => {
    setEditingEventId(ev._id);
    setEditEventForm({
      name: ev.name || '',
      location: ev.location || '',
      date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '',
      time: ev.time || '',
      description: ev.description || '',
      image: ev.image || '',
    });
    setEditEventGuests(
      Array.isArray(ev.guests) && ev.guests.length > 0
        ? ev.guests.map(g => ({ name: g.name || '', qualification: g.qualification || '' }))
        : [{ name: '', qualification: '' }]
    );
    setShowEditEvent(true);
  };

  // Events: update
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      // Prevent past dates on update
      const todayStr = new Date().toISOString().split('T')[0];
      if (editEventForm.date && editEventForm.date < todayStr) {
        toast.error('Please select today or a future date for the event');
        return;
      }
      const payload = {
        name: editEventForm.name,
        location: editEventForm.location,
        date: editEventForm.date,
        time: editEventForm.time,
        guests: editEventGuests
          .filter(g => (g.name || '').trim())
          .map(g => ({ name: g.name.trim(), qualification: (g.qualification || '').trim() })),
        description: editEventForm.description,
        image: editEventForm.image,
      };
      await eventsAPI.update(editingEventId, payload);
      toast.success('Event updated successfully');
      setShowEditEvent(false);
      setEditingEventId(null);
      setEditEventForm({ name: '', location: '', date: '', time: '', description: '', image: '' });
      setEditEventGuests([{ name: '', qualification: '' }]);
      fetchEvents();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update event';
      toast.error(msg);
    }
  };

  // Events: delete
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventsAPI.remove(id);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };


  // Blog posts: edit init
  const handleEditPost = (post) => {
    // Navigate to full editor page with preloaded state
    navigate(`/admin/blogs/${post._id}/edit`, { state: { post } });
  };

  // Blog posts: update
  const handleUpdatePost = async (postId) => {
    try {
      const payload = {
        title: blogEditForm.title,
        content: blogEditForm.content,
        coverImageUrl: blogEditForm.coverImageUrl || undefined,
        categories: blogEditForm.categories,
      };
      await blogsAPI.update(postId, payload);
      toast.success('Post updated successfully');
      setEditingBlogId(null);
      fetchBlogPosts();
    } catch (error) {
      const errs = error?.response?.data?.errors;
      if (Array.isArray(errs) && errs.length) {
        toast.error(errs.map((e) => e.msg).join('\n'));
      } else {
        toast.error(error?.response?.data?.message || 'Failed to update post');
      }
    }
  };

  // Blog posts: delete
  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await blogsAPI.remove(postId);
        toast.success('Post deleted successfully');
        fetchBlogPosts();
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  // Blog posts: create
  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newPostForm.title,
        content: newPostForm.content,
        coverImageUrl: newPostForm.coverImageUrl || undefined,
        categories: newPostForm.categories,
      };
      await blogsAPI.create(payload);
      toast.success('Post created successfully');
      setShowAddPost(false);
      setNewPostForm({ title: '', content: '', coverImageUrl: '', categories: [] });
      // refresh list
      if (blogCurrentPage !== 1) setBlogCurrentPage(1);
      fetchBlogPosts();
    } catch (error) {
      const errs = error?.response?.data?.errors;
      if (Array.isArray(errs) && errs.length) {
        toast.error(errs.map((e) => e.msg).join('\n'));
      } else {
        toast.error(error?.response?.data?.message || 'Failed to create post');
      }
    }
  };

  // Recipes: edit init
  const handleEditRecipe = (recipe) => {
    // Navigate to full editor page with preloaded state
    navigate(`/admin/recipes/${recipe._id}/edit`, { state: { recipe } });
  };

  // Recipes: delete
  const handleDeleteRecipe = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await recipesAPI.remove(id);
        toast.success('Recipe deleted successfully');
        fetchRecipes();
      } catch (error) {
        toast.error('Failed to delete recipe');
      }
    }
  };

  const handlePublishRecipe = async (id) => {
    try {
      await recipesAPI.publish(id);
      toast.success('Recipe published successfully');
      fetchRecipes();
    } catch (error) {
      toast.error('Failed to publish recipe');
    }
  };

  const handleUnpublishRecipe = async (id) => {
    try {
      await recipesAPI.unpublish(id);
      toast.success('Recipe unpublished successfully');
      fetchRecipes();
    } catch (error) {
      toast.error('Failed to unpublish recipe');
    }
  };

  const handlePublishPost = async (id) => {
    try {
      await blogsAPI.publish(id);
      toast.success('Post published successfully');
      fetchBlogPosts();
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  const handleUnpublishPost = async (id) => {
    try {
      await blogsAPI.unpublish(id);
      toast.success('Post unpublished successfully');
      fetchBlogPosts();
    } catch (error) {
      toast.error('Failed to unpublish post');
    }
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit._id);
    setEditForm({
      fullName: userToEdit.fullName || '',
      email: userToEdit.email || '',
      age: userToEdit.age || '',
      weight: userToEdit.weight || '',
      height: userToEdit.height || '',
      fitnessGoal: userToEdit.fitnessGoal || 'weight loss',
      experienceLevel: userToEdit.experienceLevel || 'beginner',
    });
    setShowEditMember(true);
  };

  const handleUpdateUser = async (userId) => {
    try {
      await usersAPI.updateUser(userId, editForm);
      toast.success('User updated successfully');
      setEditingUser(null);
      setShowEditMember(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await usersAPI.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...newMemberForm,
        confirmPassword: newMemberForm.password,
        age: parseInt(newMemberForm.age, 10),
        weight: parseFloat(newMemberForm.weight),
        height: parseFloat(newMemberForm.height),
      };

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Member created successfully');
        setShowAddMember(false);
        setNewMemberForm({
          fullName: '', email: '', password: '', age: '', weight: '', height: '',
          fitnessGoal: 'weight loss', experienceLevel: 'beginner'
        });
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create member');
      }
    } catch (error) {
      toast.error('Failed to create member');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'status-badge draft', text: 'Draft', color: '#666' },
      published: { class: 'status-badge published', text: 'Published', color: '#4caf50' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span 
        style={{
          display: 'inline-block',
          backgroundColor: badge.color,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '500'
        }}
      >
        {badge.text}
      </span>
    );
  };

  // Removed user management handlers and formatting as the admin page now only shows Total Members

  // Dashboard stat counters
  const activeTrainersCount = (allTrainers || []).filter(t => t.approvalStatus === 'approved').length || 0;
  const upcomingEventsCount = (events || []).length || 0;
  const blogPostsCount = (blogPosts || []).length || 0;
  const recipesCount = (recipes || []).length || 0;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // No active/inactive segregation needed

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Admin Panel</div>
          <div className="sidebar-subtitle">Management Dashboard</div>
        </div>
        <nav className="sidebar-menu">
          <button className={`menu-btn ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button className={`menu-btn ${activeSection === 'members' ? 'active' : ''}`} onClick={() => setActiveSection('members')}>
            <Users size={18} />
            <span>Member Management</span>
          </button>
          <button className={`menu-btn ${activeSection === 'trainers' ? 'active' : ''}`} onClick={() => setActiveSection('trainers')}>
            <Users size={18} />
            <span>Trainer Management</span>
          </button>
          <button className={`menu-btn ${activeSection === 'events' ? 'active' : ''}`} onClick={() => setActiveSection('events')}>
            <FileText size={18} />
            <span>Event Management</span>
          </button>
          <button className={`menu-btn ${activeSection === 'blogs' ? 'active' : ''}`} onClick={() => setActiveSection('blogs')}>
            <FileText size={18} />
            <span>Blog Post Management</span>
          </button>
          <button className={`menu-btn ${activeSection === 'recipes' ? 'active' : ''}`} onClick={() => setActiveSection('recipes')}>
            <FileText size={18} />
            <span>Recipe Management</span>
          </button>
        </nav>
      </aside>
      <div className="dashboard admin-content">
        <div className="container">
        

        {activeSection === 'dashboard' && (
          <>
            <h2 className="dashboard-title" style={{ marginTop: 0 }}>Dashboard</h2>
            <p className="dashboard-subtitle">Welcome back! Here's what's happening with your platform.</p>
            <div className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-title">Total Members</div>
                <div className="admin-stat-number">{totalMembers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-title">Active Trainers</div>
                <div className="admin-stat-number">{activeTrainersCount}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-title">Upcoming Events</div>
                <div className="admin-stat-number">{upcomingEventsCount}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-title">Blog Posts</div>
                <div className="admin-stat-number">{blogPostsCount}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-title">Recipes</div>
                <div className="admin-stat-number">{recipesCount}</div>
              </div>
            </div>
          </>
        )}

        {/* Users Management Section */}
        {activeSection === 'members' && (<>
        <div className="section-header">
          <h2 className="section-title">
            <Users size={24} style={{ marginRight: '8px' }} />
            Member Management
          </h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddMember(true)}
          >
            <UserPlus size={16} style={{ marginRight: '4px' }} />
            Add New Member
          </button>
        </div>

        {users.length === 0 ? (
          <div className="card text-center">
            <Users size={48} style={{ margin: '0 auto 1rem', color: '#ccc' }} />
            <h3>No members found</h3>
            <p>No gym members have registered yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Profile</th>
                  <th>Goals</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>{member.fullName}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{member.email}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{member.weight}kg, {member.height}cm</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ textTransform: 'capitalize' }}>{member.fitnessGoal}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>
                        {formatDate(member.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleEditUser(member)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          title="Edit User"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member._id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          title="Delete User"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
        </>)}

        {/* Events Management Section */}
        {activeSection === 'events' && (<>
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2 className="section-title">
            <FileText size={24} style={{ marginRight: '8px' }} />
            Event Management
          </h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddEvent(true)}
          >
            <Plus size={16} style={{ marginRight: '4px' }} />
            Add New Event
          </button>
        </div>

        {eventsLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : events.length === 0 ? (
          <div className="card text-center">
            <h3>No events found</h3>
            <p>Create your first event using the button above.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Date & time</th>
                  <th>Attendees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ev.name}</div>
                    </td>
                    <td>
                      <div>{ev.location}</div>
                    </td>
                    <td>
                      <div>
                        {ev.date && (
                          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2px' }}>
                            {new Date(ev.date).toLocaleDateString()}
                          </div>
                        )}
                        {ev.time && (
                          <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                            {ev.time}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', textAlign: 'center' }}>{ev.attendeeCount}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" title="Edit" onClick={() => handleEditEvent(ev)}><Edit size={12} /></button>
                        <button className="btn btn-danger" title="Delete" onClick={() => handleDeleteEvent(ev._id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Events Pagination */}
        {eventsTotalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setEventsCurrentPage((p) => Math.max(p - 1, 1))} disabled={eventsCurrentPage === 1}>Previous</button>
            {Array.from({ length: eventsTotalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setEventsCurrentPage(p)} className={eventsCurrentPage === p ? 'active' : ''}>{p}</button>
            ))}
            <button onClick={() => setEventsCurrentPage((p) => Math.min(p + 1, eventsTotalPages))} disabled={eventsCurrentPage === eventsTotalPages}>Next</button>
          </div>
        )}

        {/* Add Event Modal */}
        {showAddEvent && (
          <div className="modal-overlay" onClick={() => setShowAddEvent(false)}>
            <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Event</h3>
                <button className="modal-close" onClick={() => setShowAddEvent(false)}>×</button>
              </div>
              <form onSubmit={handleCreateEvent} className="modal-body">
                {/* Basic Information Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Basic Information</div>
                  <div className="form-group">
                    <label>Event Name *</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={newEventForm.name} 
                      onChange={(e) => setNewEventForm({ ...newEventForm, name: e.target.value })} 
                      placeholder="Enter event name" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={newEventForm.location} 
                      onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })} 
                      placeholder="Enter location" 
                    />
                  </div>
                  <div className="event-datetime-row">
                    <div className="form-group">
                      <label>Event Date *</label>
                      <input 
                        type="date" 
                        required 
                        className="form-input" 
                        value={newEventForm.date} 
                        onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Starting Time *</label>
                      <input 
                        type="time" 
                        required 
                        className="form-input" 
                        value={newEventForm.time} 
                        onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Special Guests Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Special Guests</div>
                  {newEventGuests.map((g, idx) => (
                    <div key={idx} className="event-guest-row">
                      <div className="event-guest-inputs">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Guest name"
                          value={g.name}
                          onChange={(e) => {
                            const next = [...newEventGuests];
                            next[idx].name = e.target.value;
                            setNewEventGuests(next);
                          }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Qualification (e.g., Nutritionist)"
                          value={g.qualification}
                          onChange={(e) => {
                            const next = [...newEventGuests];
                            next[idx].qualification = e.target.value;
                            setNewEventGuests(next);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="event-guest-remove"
                        onClick={() => setNewEventGuests(prev => prev.filter((_, i) => i !== idx))}
                        disabled={newEventGuests.length === 1}
                        title="Remove guest"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="event-add-guest"
                    onClick={() => setNewEventGuests(prev => [...prev, { name: '', qualification: '' }])}
                  >
                    Add another guest
                  </button>
                  <small className="event-form-hint">Leave empty if no special guests are attending</small>
                </div>

                {/* Event Image Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Event Image</div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/event.jpg"
                      value={newEventForm.image}
                      onChange={(e) => setNewEventForm({ ...newEventForm, image: e.target.value })}
                    />
                    {newEventForm.image && (
                      <img src={newEventForm.image} alt="Event preview" className="event-image-preview" />
                    )}
                  </div>
                </div>

                {/* Event Description Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Event Description</div>
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea 
                      required 
                      className="form-textarea event-description-field" 
                      rows="5" 
                      value={newEventForm.description} 
                      onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })} 
                      placeholder="Describe what this event is about, what attendees can expect, and any important details..."
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddEvent(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Event</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditEvent && (
          <div className="modal-overlay" onClick={() => setShowEditEvent(false)}>
            <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Event</h3>
                <button className="modal-close" onClick={() => setShowEditEvent(false)}>×</button>
              </div>
              <form onSubmit={handleUpdateEvent} className="modal-body">
                {/* Basic Information Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Basic Information</div>
                  <div className="form-group">
                    <label>Event Name *</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={editEventForm.name} 
                      onChange={(e) => setEditEventForm({ ...editEventForm, name: e.target.value })} 
                      placeholder="Enter event name" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={editEventForm.location} 
                      onChange={(e) => setEditEventForm({ ...editEventForm, location: e.target.value })} 
                      placeholder="Enter location" 
                    />
                  </div>
                  <div className="event-datetime-row">
                    <div className="form-group">
                      <label>Event Date *</label>
                      <input 
                        type="date" 
                        required 
                        className="form-input" 
                        value={editEventForm.date} 
                        onChange={(e) => setEditEventForm({ ...editEventForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Starting Time *</label>
                      <input 
                        type="time" 
                        required 
                        className="form-input" 
                        value={editEventForm.time} 
                        onChange={(e) => setEditEventForm({ ...editEventForm, time: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Special Guests Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Special Guests</div>
                  {editEventGuests.map((g, idx) => (
                    <div key={idx} className="event-guest-row">
                      <div className="event-guest-inputs">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Guest name"
                          value={g.name}
                          onChange={(e) => {
                            const next = [...editEventGuests];
                            next[idx].name = e.target.value;
                            setEditEventGuests(next);
                          }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Qualification (e.g., Nutritionist)"
                          value={g.qualification}
                          onChange={(e) => {
                            const next = [...editEventGuests];
                            next[idx].qualification = e.target.value;
                            setEditEventGuests(next);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="event-guest-remove"
                        onClick={() => setEditEventGuests(prev => prev.filter((_, i) => i !== idx))}
                        disabled={editEventGuests.length === 1}
                        title="Remove guest"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="event-add-guest"
                    onClick={() => setEditEventGuests(prev => [...prev, { name: '', qualification: '' }])}
                  >
                    Add another guest
                  </button>
                  <small className="event-form-hint">Leave empty if no special guests are attending</small>
                </div>

                {/* Event Image Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Event Image</div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/event.jpg"
                      value={editEventForm.image}
                      onChange={(e) => setEditEventForm({ ...editEventForm, image: e.target.value })}
                    />
                    {editEventForm.image && (
                      <img src={editEventForm.image} alt="Event preview" className="event-image-preview" />
                    )}
                  </div>
                </div>

                {/* Event Description Section */}
                <div className="event-form-section">
                  <div className="event-form-section-title">Event Description</div>
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea 
                      required 
                      className="form-textarea event-description-field" 
                      rows="5" 
                      value={editEventForm.description} 
                      onChange={(e) => setEditEventForm({ ...editEventForm, description: e.target.value })} 
                      placeholder="Describe what this event is about, what attendees can expect, and any important details..."
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditEvent(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Event</button>
                </div>
              </form>
            </div>
          </div>
        )}
        </>)}

        {/* Add Member Modal */}
        {activeSection === 'members' && showAddMember && (
          <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Member</h3>
                <button className="modal-close" onClick={() => setShowAddMember(false)}>×</button>
              </div>
              <form onSubmit={handleCreateMember} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" required value={newMemberForm.fullName}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                      className="form-input" placeholder="Enter full name" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" required value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                      className="form-input" placeholder="Enter email address" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input type="password" required value={newMemberForm.password}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                      className="form-input" placeholder="Enter password" minLength="6" />
                  </div>
                  <div className="form-group">
                    <label>Age *</label>
                    <input type="number" required min="13" max="100" value={newMemberForm.age}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, age: e.target.value })}
                      className="form-input" placeholder="Age" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Weight (kg) *</label>
                    <input type="number" required min="30" max="300" value={newMemberForm.weight}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, weight: e.target.value })}
                      className="form-input" placeholder="Weight in kg" />
                  </div>
                  <div className="form-group">
                    <label>Height (cm) *</label>
                    <input type="number" required min="100" max="250" value={newMemberForm.height}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, height: e.target.value })}
                      className="form-input" placeholder="Height in cm" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fitness Goal *</label>
                    <select value={newMemberForm.fitnessGoal}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, fitnessGoal: e.target.value })}
                      className="form-select" required>
                      <option value="weight loss">Weight Loss</option>
                      <option value="muscle gain">Muscle Gain</option>
                      <option value="endurance">Endurance</option>
                      <option value="flexibility">Flexibility</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Experience Level *</label>
                    <select value={newMemberForm.experienceLevel}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, experienceLevel: e.target.value })}
                      className="form-select" required>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <UserPlus size={16} style={{ marginRight: '4px' }} />
                    Create Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Edit Member Modal */}
        {activeSection === 'members' && showEditMember && (
          <div className="modal-overlay" onClick={() => { setShowEditMember(false); setEditingUser(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Member</h3>
                <button className="modal-close" onClick={() => { setShowEditMember(false); setEditingUser(null); }}>×</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(editingUser); }} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      min="13"
                      max="100"
                      className="form-input"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      placeholder="Age"
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      className="form-input"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                      placeholder="Weight in kg"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      min="100"
                      max="250"
                      className="form-input"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                      placeholder="Height in cm"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fitness Goal</label>
                    <select
                      className="form-select"
                      value={editForm.fitnessGoal}
                      onChange={(e) => setEditForm({ ...editForm, fitnessGoal: e.target.value })}
                    >
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
                    <select
                      className="form-select"
                      value={editForm.experienceLevel}
                      onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowEditMember(false); setEditingUser(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Trainer Management Section */}
        {activeSection === 'trainers' && (<>
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2 className="section-title">
            <Users size={24} style={{ marginRight: '8px' }} />
            Trainer Management
          </h2>
          <button className="btn btn-primary" onClick={() => setShowAddTrainer(true)}>
            <UserPlus size={16} style={{ marginRight: '4px' }} /> Add Trainer
          </button>
        </div>

        {/* Add Trainer Form */}
        {showAddTrainer && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3>Add New Trainer</h3>
            <form onSubmit={handleCreateTrainer}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={newTrainerForm.fullName}
                    onChange={(e) => setNewTrainerForm({ ...newTrainerForm, fullName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={newTrainerForm.email}
                    onChange={(e) => setNewTrainerForm({ ...newTrainerForm, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    value={newTrainerForm.password}
                    onChange={(e) => setNewTrainerForm({ ...newTrainerForm, password: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                {/* Removed Age/Weight/Height inputs as requested; defaults will be sent in payload */}
                <div className="form-group">
                  <label className="form-label">Session Rate (LKR per session) *</label>
                  <input
                    type="number"
                    value={newTrainerForm.sessionRate}
                    onChange={(e) => setNewTrainerForm({ ...newTrainerForm, sessionRate: e.target.value })}
                    className="form-input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Bio *</label>
                <textarea
                  value={newTrainerForm.bio}
                  onChange={(e) => setNewTrainerForm({ ...newTrainerForm, bio: e.target.value })}
                  className="form-input"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setNewTrainerForm({ ...newTrainerForm, profileImage: reader.result });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {newTrainerForm.profileImage && (
                  <img src={newTrainerForm.profileImage} alt="Trainer preview" className="event-image-preview" />
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Specialties *</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['Weight Loss', 'Strength Training', 'Yoga Instructor', 'Bodybuilding'].map(specialty => (
                    <label key={specialty} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={newTrainerForm.specialties.includes(specialty)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTrainerForm({
                              ...newTrainerForm,
                              specialties: [...newTrainerForm.specialties, specialty]
                            });
                          } else {
                            setNewTrainerForm({
                              ...newTrainerForm,
                              specialties: newTrainerForm.specialties.filter(s => s !== specialty)
                            });
                          }
                        }}
                      />
                      {specialty}
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Slot (single) */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Time Slot *</label>
                <div className="event-guest-inputs">
                  <input
                    type="time"
                    className="form-input"
                    required
                    value={(newTrainerForm.availability?.timeSlots || [{ start: '', end: '' }])[0].start}
                    onChange={(e) => {
                      const next = { ...(newTrainerForm.availability || { timeSlots: [{ start: '', end: '' }] }) };
                      next.timeSlots = [...(next.timeSlots || [{ start: '', end: '' }])];
                      next.timeSlots[0] = { ...(next.timeSlots[0] || {}), start: e.target.value };
                      setNewTrainerForm({ ...newTrainerForm, availability: next });
                    }}
                  />
                  <input
                    type="time"
                    className="form-input"
                    required
                    value={(newTrainerForm.availability?.timeSlots || [{ start: '', end: '' }])[0].end}
                    onChange={(e) => {
                      const next = { ...(newTrainerForm.availability || { timeSlots: [{ start: '', end: '' }] }) };
                      next.timeSlots = [...(next.timeSlots || [{ start: '', end: '' }])];
                      next.timeSlots[0] = { ...(next.timeSlots[0] || {}), end: e.target.value };
                      setNewTrainerForm({ ...newTrainerForm, availability: next });
                    }}
                  />
                </div>
              </div>


              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTrainer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Trainer</button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Trainer Modal (correctly placed in Trainers section) */}
        {showEditTrainer && (
          <div className="modal-overlay" onClick={() => { setShowEditTrainer(false); setEditingTrainer(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Trainer</h3>
                <button className="modal-close" onClick={() => { setShowEditTrainer(false); setEditingTrainer(null); }}>×</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTrainer(editingTrainer); }} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" className="form-input" value={trainerEditForm.fullName} onChange={(e) => setTrainerEditForm({ ...trainerEditForm, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="form-input" value={trainerEditForm.email} onChange={(e) => setTrainerEditForm({ ...trainerEditForm, email: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea className="form-input" rows="3" value={trainerEditForm.bio} onChange={(e) => setTrainerEditForm({ ...trainerEditForm, bio: e.target.value })} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Session Rate (LKR per session)</label>
                    <input type="number" min="0" step="0.01" className="form-input" value={trainerEditForm.sessionRate} onChange={(e) => setTrainerEditForm({ ...trainerEditForm, sessionRate: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setTrainerEditForm({ ...trainerEditForm, profileImage: reader.result });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {trainerEditForm.profileImage && (
                    <img src={trainerEditForm.profileImage} alt="Trainer preview" className="event-image-preview" />
                  )}
                </div>

                <div className="form-group">
                  <label>Specialties</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {['Weight Loss', 'Strength Training', 'Yoga Instructor', 'Bodybuilding'].map(specialty => (
                      <label key={specialty} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={(trainerEditForm.specialties || []).includes(specialty)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTrainerEditForm({ ...trainerEditForm, specialties: [...(trainerEditForm.specialties || []), specialty] });
                            } else {
                              setTrainerEditForm({ ...trainerEditForm, specialties: (trainerEditForm.specialties || []).filter(s => s !== specialty) });
                            }
                          }}
                        />
                        {specialty}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Time Slot</label>
                  <div className="event-guest-inputs">
                    <input
                      type="time"
                      className="form-input"
                      value={(trainerEditForm.availability?.timeSlots || [{ start: '', end: '' }])[0].start}
                      onChange={(e) => {
                        const next = { ...(trainerEditForm.availability || { timeSlots: [{ start: '', end: '' }] }) };
                        next.timeSlots = [...(next.timeSlots || [{ start: '', end: '' }])];
                        next.timeSlots[0] = { ...(next.timeSlots[0] || {}), start: e.target.value };
                        setTrainerEditForm({ ...trainerEditForm, availability: next });
                      }}
                    />
                    <input
                      type="time"
                      className="form-input"
                      value={(trainerEditForm.availability?.timeSlots || [{ start: '', end: '' }])[0].end}
                      onChange={(e) => {
                        const next = { ...(trainerEditForm.availability || { timeSlots: [{ start: '', end: '' }] }) };
                        next.timeSlots = [...(next.timeSlots || [{ start: '', end: '' }])];
                        next.timeSlots[0] = { ...(next.timeSlots[0] || {}), end: e.target.value };
                        setTrainerEditForm({ ...trainerEditForm, availability: next });
                      }}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowEditTrainer(false); setEditingTrainer(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Trainer Status Filter removed as requested */}

        {allTrainersLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : allTrainers.length === 0 ? (
          <div className="card text-center">
            <Users size={48} style={{ margin: '0 auto 1rem', color: '#ccc' }} />
            <h3>No trainers found</h3>
            <p>Create your first trainer.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Contact</th>
                  <th>Specialties</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allTrainers.map((trainer) => (
                  <tr key={trainer._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>{trainer.fullName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          {trainer.bio?.substring(0, 60)}...
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{trainer.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {trainer.specialties?.map((specialty, index) => (
                          <span 
                            key={index}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '11px'
                            }}
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>LKR {trainer.sessionRate}/Per Session</div>
                    </td>
                    <td>
                      <span className={`status-badge ${trainer.approvalStatus}`}>
                        {trainer.approvalStatus === 'approved' ? 'Approved' : 
                         trainer.approvalStatus === 'pending' ? 'Pending' : 'Rejected'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {trainer.approvalStatus === 'pending' && (
                          <button
                            onClick={() => handleTrainerStatusChange(trainer._id, 'approved')}
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            title="Approve"
                          >
                            <UserCheck size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewTrainer(trainer)}
                          className="btn btn-info"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          title="View Profile"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleEditTrainer(trainer)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          title="Edit Trainer"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrainer(trainer._id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          title="Delete Trainer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* All Trainers Pagination */}
        {allTrainersTotalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setAllTrainersCurrentPage((p) => Math.max(p - 1, 1))} disabled={allTrainersCurrentPage === 1}>Previous</button>
            {Array.from({ length: allTrainersTotalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setAllTrainersCurrentPage(page)} className={allTrainersCurrentPage === page ? 'active' : ''}>{page}</button>
            ))}
            <button onClick={() => setAllTrainersCurrentPage((p) => Math.min(p + 1, allTrainersTotalPages))} disabled={allTrainersCurrentPage === allTrainersTotalPages}>Next</button>
          </div>
        )}
        </>)}

        {/* Blog Post Management Section */}
        {activeSection === 'blogs' && (<>
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2 className="section-title">
            <FileText size={24} style={{ marginRight: '8px' }} />
            Blog Post Management
          </h2>
          <button className="btn btn-primary" onClick={() => navigate('/admin/blogs/new')}>
            <Plus size={16} style={{ marginRight: '4px' }} /> New Post
          </button>
        </div>

        {blogLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : blogPosts.length === 0 ? (
          <div className="card text-center">
            <FileText size={48} style={{ margin: '0 auto 1rem', color: '#ccc' }} />
            <h3>No posts found</h3>
            <p>Create your first fitness blog post.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Categories</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogPosts.map((post) => (
                  <tr key={post._id}>
                    <td>
                      {editingBlogId === post._id ? (
                        <input
                          type="text"
                          value={blogEditForm.title}
                          onChange={(e) => setBlogEditForm({ ...blogEditForm, title: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                        />
                      ) : (
                        <div style={{ fontWeight: 600 }}>{post.title}</div>
                      )}
                    </td>
                    <td>
                      {post.categories && post.categories.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {post.categories.map((category, index) => (
                            <span
                              key={index}
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '11px'
                              }}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>No categories</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>
                        {post.author?.fullName || 'Unknown'}
                        {post.author?.role === 'trainer' && (
                          <span style={{ color: '#1976d2', fontSize: '0.8rem', marginLeft: '4px' }}>
                            (Trainer)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(post.status)}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {editingBlogId === post._id ? (
                          <>
                            <button
                              onClick={() => handleUpdatePost(post._id)}
                              className="btn btn-success"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingBlogId(null)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {post.status === 'draft' ? (
                              <button
                                onClick={() => handlePublishPost(post._id)}
                                className="btn btn-success"
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                title="Publish Post"
                              >
                                <Eye size={12} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnpublishPost(post._id)}
                                className="btn btn-warning"
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                title="Unpublish Post"
                              >
                                <EyeOff size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditPost(post)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Edit Post"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Delete Post"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {blogTotalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setBlogCurrentPage((p) => Math.max(p - 1, 1))} disabled={blogCurrentPage === 1}>Previous</button>
            {Array.from({ length: blogTotalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setBlogCurrentPage(page)} className={blogCurrentPage === page ? 'active' : ''}>{page}</button>
            ))}
            <button onClick={() => setBlogCurrentPage((p) => Math.min(p + 1, blogTotalPages))} disabled={blogCurrentPage === blogTotalPages}>Next</button>
          </div>
        )}
        </>)}

        {/* Recipe Management Section */}
        {activeSection === 'recipes' && (<>
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2 className="section-title">
            <FileText size={24} style={{ marginRight: '8px' }} />
            Recipe Management
          </h2>
          <button className="btn btn-primary" onClick={() => navigate('/admin/recipes/new')}>
            <Plus size={16} style={{ marginRight: '4px' }} /> New Recipe
          </button>
        </div>

        {recipeLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : recipes.length === 0 ? (
          <div className="card text-center">
            <FileText size={48} style={{ margin: '0 auto 1rem', color: '#ccc' }} />
            <h3>No recipes found</h3>
            <p>Create your first fitness recipe.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Recipe</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe) => (
                  <tr key={recipe._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {recipe.image && (
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/50x50?text=Recipe'; }}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{recipe.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {recipe.category ? (
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '11px'
                          }}
                        >
                          {recipe.category}
                        </span>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>No category</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>
                        {recipe.author?.fullName || 'Unknown'}
                        {recipe.author?.role === 'trainer' && (
                          <span style={{ color: '#1976d2', fontSize: '0.8rem', marginLeft: '4px' }}>
                            (Trainer)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(recipe.status)}</td>
                    <td>{formatDate(recipe.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {recipe.status === 'draft' ? (
                          <button
                            onClick={() => handlePublishRecipe(recipe._id)}
                            className="btn btn-success"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            title="Publish Recipe"
                          >
                            <Eye size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpublishRecipe(recipe._id)}
                            className="btn btn-warning"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            title="Unpublish Recipe"
                          >
                            <EyeOff size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditRecipe(recipe)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          title="Edit Recipe"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe._id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          title="Delete Recipe"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recipeTotalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setRecipeCurrentPage((p) => Math.max(p - 1, 1))} disabled={recipeCurrentPage === 1}>Previous</button>
            {Array.from({ length: recipeTotalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setRecipeCurrentPage(page)} className={recipeCurrentPage === page ? 'active' : ''}>{page}</button>
            ))}
            <button onClick={() => setRecipeCurrentPage((p) => Math.min(p + 1, recipeTotalPages))} disabled={recipeCurrentPage === recipeTotalPages}>Next</button>
          </div>
        )}
        </>)}

        {/* Add/Edit Post Modal */}
        {activeSection === 'blogs' && showAddPost && (
          <div className="modal-overlay" onClick={() => setShowAddPost(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Post</h3>
                <button className="modal-close" onClick={() => setShowAddPost(false)}>×</button>
              </div>
              <form onSubmit={handleCreatePost} className="modal-body">
                <div className="form-group">
                  <label>Title * (max 150 characters)</label>
                  <input 
                    type="text" 
                    required 
                    maxLength="150" 
                    value={newPostForm.title} 
                    onChange={(e) => setNewPostForm({ ...newPostForm, title: e.target.value })} 
                    className="form-input" 
                    placeholder="Enter title"
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {newPostForm.title.length}/150 characters
                  </div>
                </div>
                <div className="form-group">
                  <label>Content *</label>
                  <textarea required value={newPostForm.content} onChange={(e) => setNewPostForm({ ...newPostForm, content: e.target.value })} className="form-input" placeholder="Write your article..." rows={8} />
                </div>
                <div className="form-group">
                  <label>Cover Image URL</label>
                  <input type="url" value={newPostForm.coverImageUrl} onChange={(e) => setNewPostForm({ ...newPostForm, coverImageUrl: e.target.value })} className="form-input" placeholder="https://... or /images/cover.jpg" />
                </div>
                <div className="form-group">
                  <label>Categories (optional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginTop: '8px' }}>
                    {availableCategories.map((category) => (
                      <label key={category} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: newPostForm.categories.includes(category) ? '#e3f2fd' : 'transparent', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={newPostForm.categories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPostForm({ ...newPostForm, categories: [...newPostForm.categories, category] });
                            } else {
                              setNewPostForm({ ...newPostForm, categories: newPostForm.categories.filter(c => c !== category) });
                            }
                          }}
                          style={{ marginRight: '6px' }}
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                  {/* Categories are optional */}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddPost(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Post</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Trainer Modal */}
        {activeSection === 'trainers' && showViewTrainer && viewingTrainer && (
          <div className="modal-overlay" onClick={() => setShowViewTrainer(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Trainer Profile Details</h3>
                <button className="modal-close" onClick={() => setShowViewTrainer(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="form-display">{viewingTrainer.fullName}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div className="form-display">{viewingTrainer.email}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Rate</label>
                    <div className="form-display">LKR {viewingTrainer.sessionRate}/Per Session</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div className="form-display">
                      <span className={`status-badge ${viewingTrainer.approvalStatus}`}>
                        {viewingTrainer.approvalStatus === 'approved' ? 'Approved' : 
                         viewingTrainer.approvalStatus === 'pending' ? 'Pending' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Bio</label>
                  <div className="form-display" style={{ whiteSpace: 'pre-wrap' }}>{viewingTrainer.bio}</div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Specialties</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {viewingTrainer.specialties?.map((specialty, index) => (
                      <span 
                        key={index}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {viewingTrainer.profileImage && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Profile Image</label>
                    <div style={{ marginTop: '0.5rem' }}>
                      <img 
                        src={viewingTrainer.profileImage} 
                        alt="Trainer Profile" 
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '200px', 
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <div className="form-display">{viewingTrainer.age} years</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weight</label>
                    <div className="form-display">{viewingTrainer.weight} kg</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Height</label>
                    <div className="form-display">{viewingTrainer.height} cm</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Joined</label>
                    <div className="form-display">{formatDate(viewingTrainer.createdAt)}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowViewTrainer(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default AdminDashboard;
