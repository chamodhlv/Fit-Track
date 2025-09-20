import React, { useState, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    bio: '',
    specialties: [],
    sessionRate: '',
    sessionCapacity: '',
    availability: {
      days: [],
      timeSlots: [{ start: '', end: '' }]
    },
    profileImage: ''
  });

  const specialtyOptions = [
    'Weight Loss',
    'Strength Training', 
    'Yoga Instructor',
    'Bodybuilding'
  ];

  const dayOptions = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
        bio: user.bio || '',
        specialties: user.specialties || [],
        sessionRate: user.sessionRate || '',
        sessionCapacity: user.sessionCapacity || '1',
        availability: {
          days: user.availability?.days || [],
          timeSlots: user.availability?.timeSlots || [{ start: '', end: '' }]
        },
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);

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
    } else if (name === 'availableDays') {
      if (checked) {
        setProfileForm(prev => ({
          ...prev,
          availability: {
            ...prev.availability,
            days: [...prev.availability.days, value]
          }
        }));
      } else {
        setProfileForm(prev => ({
          ...prev,
          availability: {
            ...prev.availability,
            days: prev.availability.days.filter(d => d !== value)
          }
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

    if (profileForm.availability.days.length === 0) {
      toast.error("Please select at least one available day");
      return;
    }

    if (profileForm.availability.timeSlots.some(slot => !slot.start || !slot.end)) {
      toast.error("Please fill in all time slots");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email,
          bio: profileForm.bio,
          specialties: profileForm.specialties,
          sessionRate: parseFloat(profileForm.sessionRate),
          sessionCapacity: parseInt(profileForm.sessionCapacity, 10),
          availability: profileForm.availability,
          profileImage: profileForm.profileImage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully');
        setEditing(false);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(error => toast.error(error.msg));
        } else {
          toast.error(data.message || 'Update failed');
        }
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
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome back, {user?.fullName}!</h1>
        </div>

        {/* Trainer Profile Card */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <Activity size={20} style={{ marginRight: '8px' }} />
            Your Trainer Profile
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
                      <p><strong>Session Rate:</strong> LKR {user?.sessionRate}/hour</p>
                      <p><strong>Max Trainees per Session:</strong> {user?.sessionCapacity}</p>
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
                      <p><strong>Available Days:</strong></p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {user?.availability?.days?.map(day => (
                          <span key={day} className="day-tag">
                            {day}
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
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
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
                  <label>Session Rate (LKR per hour)</label>
                  <input type="number" min="0" step="1" value={profileForm.sessionRate}
                    onChange={(e) => setProfileForm({ ...profileForm, sessionRate: e.target.value })}
                    className="form-input" required />
                </div>
                <div className="form-group">
                  <label>Max Trainees per Session</label>
                  <input type="number" min="1" step="1" value={profileForm.sessionCapacity}
                    onChange={(e) => setProfileForm({ ...profileForm, sessionCapacity: e.target.value })}
                    className="form-input" required />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="form-input" rows="4" style={{ resize: 'vertical' }} required />
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
                <label>Available Days</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {dayOptions.map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="availableDays"
                        value={day}
                        checked={profileForm.availability.days.includes(day)}
                        onChange={handleChange}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {day}
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
      </div>
    </div>
  );
};

export default TrainerDashboard;
