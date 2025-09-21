import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, blogsAPI, recipesAPI } from '../services/api';
import { Users, Edit, Trash2, UserPlus, FileText, Plus, UserCheck, UserX, Clock, Eye, EyeOff } from 'lucide-react';
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

  // Trainer approval state
  const [trainerLoading, setTrainerLoading] = useState(true);
  const [pendingTrainers, setPendingTrainers] = useState([]);
  const [trainerCurrentPage, setTrainerCurrentPage] = useState(1);
  const [trainerTotalPages, setTrainerTotalPages] = useState(1);
  const [processingTrainer, setProcessingTrainer] = useState(null);

  // Trainer management state
  const [allTrainersLoading, setAllTrainersLoading] = useState(true);
  const [allTrainers, setAllTrainers] = useState([]);
  const [allTrainersCurrentPage, setAllTrainersCurrentPage] = useState(1);
  const [allTrainersTotalPages, setAllTrainersTotalPages] = useState(1);
  const [trainerStatusFilter, setTrainerStatusFilter] = useState('all');
  const [editingTrainer, setEditingTrainer] = useState(null);
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
    fetchPendingTrainers();
  }, [trainerCurrentPage]);

  useEffect(() => {
    fetchAllTrainers();
  }, [allTrainersCurrentPage, trainerStatusFilter]);

  useEffect(() => {
    fetchBlogPosts();
  }, [blogCurrentPage]);

  useEffect(() => {
    fetchRecipes();
  }, [recipeCurrentPage]);

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

  const fetchPendingTrainers = async () => {
    try {
      setTrainerLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/trainers/pending?page=${trainerCurrentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setPendingTrainers(data.trainers || []);
        setTrainerTotalPages(data.totalPages || 1);
      } else {
        toast.error('Failed to fetch pending trainers');
      }
    } catch (error) {
      toast.error('Failed to fetch pending trainers');
    } finally {
      setTrainerLoading(false);
    }
  };

  // Trainer management functions
  const fetchAllTrainers = async () => {
    try {
      setAllTrainersLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/trainers?page=${allTrainersCurrentPage}&limit=10`, {
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
  };

  const handleUpdateTrainer = async (trainerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/trainers/${trainerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(trainerEditForm)
      });

      if (response.ok) {
        toast.success('Trainer updated successfully');
        setEditingTrainer(null);
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

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
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
          availability: newTrainerForm.availability,
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

  const handleApproveTrainer = async (trainerId) => {
    if (processingTrainer) return;
    
    setProcessingTrainer(trainerId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/trainers/${trainerId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Trainer approved successfully');
        fetchPendingTrainers(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to approve trainer');
      }
    } catch (error) {
      toast.error('Failed to approve trainer');
    } finally {
      setProcessingTrainer(null);
    }
  };

  const handleRejectTrainer = async (trainerId) => {
    if (processingTrainer) return;
    
    if (!window.confirm('Are you sure you want to reject this trainer application? This action cannot be undone.')) {
      return;
    }
    
    setProcessingTrainer(trainerId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/trainers/${trainerId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Trainer application rejected');
        fetchPendingTrainers(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to reject trainer');
      }
    } catch (error) {
      toast.error('Failed to reject trainer');
    } finally {
      setProcessingTrainer(null);
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
  };

  const handleUpdateUser = async (userId) => {
    try {
      await usersAPI.updateUser(userId, editForm);
      toast.success('User updated successfully');
      setEditingUser(null);
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // No active/inactive segregation needed

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
        </div>

        {/* Stats Section removed as requested */}

        {/* Users Management Section */}
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
                      {editingUser === member._id ? (
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: '600' }}>{member.fullName}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingUser === member._id ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                        />
                      ) : (
                        <div>
                          <div>{member.email}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingUser === member._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="number"
                            value={editForm.weight}
                            onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                            placeholder="Weight"
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '2px 6px' }}
                          />
                          <input
                            type="number"
                            value={editForm.height}
                            onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                            placeholder="Height"
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '2px 6px' }}
                          />
                        </div>
                      ) : (
                        <div>
                          <div>{member.weight}kg, {member.height}cm</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingUser === member._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            value={editForm.fitnessGoal}
                            onChange={(e) => setEditForm({ ...editForm, fitnessGoal: e.target.value })}
                            className="form-select"
                            style={{ fontSize: '0.8rem', padding: '2px 6px' }}
                          >
                            <option value="weight loss">Weight Loss</option>
                            <option value="muscle gain">Muscle Gain</option>
                            <option value="endurance">Endurance</option>
                            <option value="flexibility">Flexibility</option>
                          </select>
                          <select
                            value={editForm.experienceLevel}
                            onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value })}
                            className="form-select"
                            style={{ fontSize: '0.8rem', padding: '2px 6px' }}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div style={{ textTransform: 'capitalize' }}>{member.fitnessGoal}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>
                        {formatDate(member.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {editingUser === member._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateUser(member._id)}
                              className="btn btn-success"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
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

        {/* Add Member Modal */}
        {showAddMember && (
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

        {/* Trainer Approval Section */}
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2 className="section-title">
            <UserCheck size={24} style={{ marginRight: '8px' }} />
            Trainer Approval
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            <Clock size={16} />
            {pendingTrainers.length} pending applications
          </div>
        </div>

        {trainerLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : pendingTrainers.length === 0 ? (
          <div className="card text-center">
            <UserCheck size={48} style={{ margin: '0 auto 1rem', color: '#ccc' }} />
            <h3>No pending trainer applications</h3>
            <p>All trainer applications have been processed.</p>
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
                  <th>Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTrainers.map((trainer) => (
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
                              background: '#e3f2fd',
                              color: '#1976d2',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
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
                      <div style={{ fontSize: '0.9rem' }}>
                        {formatDate(trainer.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleApproveTrainer(trainer._id)}
                          className="btn btn-success"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          disabled={processingTrainer === trainer._id}
                          title="Approve Trainer"
                        >
                          {processingTrainer === trainer._id ? (
                            'Processing...'
                          ) : (
                            <>
                              <UserCheck size={12} style={{ marginRight: '2px' }} />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectTrainer(trainer._id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          disabled={processingTrainer === trainer._id}
                          title="Reject Trainer"
                        >
                          <UserX size={12} style={{ marginRight: '2px' }} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Trainer Pagination */}
        {trainerTotalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setTrainerCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={trainerCurrentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: trainerTotalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setTrainerCurrentPage(page)}
                className={trainerCurrentPage === page ? 'active' : ''}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setTrainerCurrentPage(prev => Math.min(prev + 1, trainerTotalPages))}
              disabled={trainerCurrentPage === trainerTotalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Trainer Management Section */}
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


              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTrainer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Trainer</button>
              </div>
            </form>
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
                      {editingTrainer === trainer._id ? (
                        <input
                          type="text"
                          value={trainerEditForm.fullName}
                          onChange={(e) => setTrainerEditForm({ ...trainerEditForm, fullName: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: '600' }}>{trainer.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                            {trainer.bio?.substring(0, 60)}...
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingTrainer === trainer._id ? (
                        <input
                          type="email"
                          value={trainerEditForm.email}
                          onChange={(e) => setTrainerEditForm({ ...trainerEditForm, email: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.9rem', padding: '4px 8px' }}
                        />
                      ) : (
                        <div>{trainer.email}</div>
                      )}
                    </td>
                    <td>
                      {editingTrainer === trainer._id ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {['Weight Loss', 'Strength Training', 'Yoga Instructor', 'Bodybuilding'].map(specialty => (
                            <label key={specialty} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                              <input
                                type="checkbox"
                                checked={trainerEditForm.specialties.includes(specialty)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTrainerEditForm({
                                      ...trainerEditForm,
                                      specialties: [...trainerEditForm.specialties, specialty]
                                    });
                                  } else {
                                    setTrainerEditForm({
                                      ...trainerEditForm,
                                      specialties: trainerEditForm.specialties.filter(s => s !== specialty)
                                    });
                                  }
                                }}
                              />
                              {specialty}
                            </label>
                          ))}
                        </div>
                      ) : (
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
                      )}
                    </td>
                    <td>
                      {editingTrainer === trainer._id ? (
                        <input
                          type="number"
                          value={trainerEditForm.sessionRate}
                          onChange={(e) => setTrainerEditForm({ ...trainerEditForm, sessionRate: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.9rem', padding: '4px 8px', width: '80px' }}
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <div style={{ fontWeight: '600' }}>LKR {trainer.sessionRate}/Per Session</div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${trainer.approvalStatus}`}>
                        {trainer.approvalStatus === 'approved' ? 'Approved' : 
                         trainer.approvalStatus === 'pending' ? 'Pending' : 'Rejected'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {editingTrainer === trainer._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateTrainer(trainer._id)}
                              className="btn btn-success"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTrainer(null)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {trainer.approvalStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleTrainerStatusChange(trainer._id, 'approved')}
                                  className="btn btn-success"
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                  title="Approve"
                                >
                                  <UserCheck size={12} />
                                </button>
                                <button
                                  onClick={() => handleTrainerStatusChange(trainer._id, 'rejected')}
                                  className="btn btn-warning"
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                  title="Reject"
                                >
                                  <UserX size={12} />
                                </button>
                              </>
                            )}
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

        {/* Blog Post Management Section */}
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

        {/* Recipe Management Section */}
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

        {/* Add/Edit Post Modal */}
        {showAddPost && (
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
      </div>
    </div>
  );
};

export default AdminDashboard;
