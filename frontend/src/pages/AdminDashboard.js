import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, blogsAPI } from '../services/api';
import { Users, Edit, Trash2, UserPlus, FileText, Plus, UserCheck, UserX, Clock } from 'lucide-react';
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

  // Blog management state
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogCurrentPage, setBlogCurrentPage] = useState(1);
  const [blogTotalPages, setBlogTotalPages] = useState(1);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [blogEditForm, setBlogEditForm] = useState({ title: '', content: '', coverImageUrl: '', categories: [] });
  const [showAddPost, setShowAddPost] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: '', content: '', coverImageUrl: '', categories: [] });

  const availableCategories = [
    'Strength Training',
    'Yoga & Flexibility',
    'Cardio & Endurance',
    'Weight Loss',
    'Muscle Building',
    'Health & Recovery'
  ];

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  useEffect(() => {
    fetchPendingTrainers();
  }, [trainerCurrentPage]);

  useEffect(() => {
    fetchBlogPosts();
  }, [blogCurrentPage]);

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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

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
                      <div style={{ fontWeight: '600' }}>${trainer.sessionRate}/hr</div>
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
                  <label>Title *</label>
                  <input type="text" required value={newPostForm.title} onChange={(e) => setNewPostForm({ ...newPostForm, title: e.target.value })} className="form-input" placeholder="Enter title" />
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
