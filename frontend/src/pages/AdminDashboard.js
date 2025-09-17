import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { Users, Edit, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

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
      </div>
    </div>
  );
};

export default AdminDashboard;
