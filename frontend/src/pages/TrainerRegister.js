import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Camera,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";

const TrainerRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    specialties: [],
    sessionRate: "",
    availability: {
      timeSlots: [{ start: "", end: "" }]
    },
    profileImage: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const specialtyOptions = [
    'Weight Loss',
    'Strength Training', 
    'Yoga Instructor',
    'Bodybuilding'
  ];


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'specialties') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          specialties: [...prev.specialties, value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          specialties: prev.specialties.filter(s => s !== value)
        }));
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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
      setFormData((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...formData.availability.timeSlots];
    newTimeSlots[index][field] = value;
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: newTimeSlots
      }
    }));
  };

  // Restrict to a single time slot: no add/remove controls

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.specialties.length === 0) {
      toast.error("Please select at least one specialty");
      return;
    }


    if (formData.availability.timeSlots.some(slot => !slot.start || !slot.end)) {
      toast.error("Please fill in all time slots");
      return;
    }


    setLoading(true);

    try {
      const response = await fetch('/api/auth/register-trainer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message, { duration: 10000 });
        navigate('/login');
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(error => toast.error(error.msg));
        } else {
          toast.error(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '800px' }}>
        <h1 className="auth-title">Register as Trainer</h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
          Join our team of professional trainers and help members achieve their fitness goals
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Basic Account Info */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Basic Account Information</h3>
            
            <div className="form-group">
              <label className="form-label">
                <User size={16} style={{ marginRight: "8px", display: "inline" }} />
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={16} style={{ marginRight: "8px", display: "inline" }} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} style={{ marginRight: "8px", display: "inline" }} />
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter password"
                    required
                    minLength="6"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} style={{ marginRight: "8px", display: "inline" }} />
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm password"
                    required
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trainer-Specific Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Trainer Details</h3>
            
            <div className="form-group">
              <label className="form-label">
                <FileText size={16} style={{ marginRight: "8px", display: "inline" }} />
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="form-input"
                placeholder="Tell us about yourself, your experience, and training philosophy..."
                required
                minLength="10"
                rows="4"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Award size={16} style={{ marginRight: "8px", display: "inline" }} />
                Specialties (Select all that apply)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                {specialtyOptions.map(specialty => (
                  <label key={specialty} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="specialties"
                      value={specialty}
                      checked={formData.specialties.includes(specialty)}
                      onChange={handleChange}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {specialty}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <DollarSign size={16} style={{ marginRight: "8px", display: "inline" }} />
                Session Rate (LKR per hour)
              </label>
              <input
                type="number"
                name="sessionRate"
                value={formData.sessionRate}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your hourly rate in LKR"
                required
                min="0"
                step="1"
              />
            </div>


            <div className="form-group">
              <label className="form-label">
                <Camera size={16} style={{ marginRight: "8px", display: "inline" }} />
                Profile Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="form-input"
              />
              {formData.profileImage && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={formData.profileImage} alt="Preview" style={{ maxWidth: '120px', borderRadius: '8px' }} />
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Availability</h3>
            

            <div className="form-group">
              <label className="form-label">
                <Clock size={16} style={{ marginRight: "8px", display: "inline" }} />
                Time Slots
              </label>
              {formData.availability.timeSlots.map((slot, index) => (
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
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Submitting Application..." : "Submit Trainer Application"}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Want to register as a member instead? <Link to="/register">Register as Member</Link>
          </p>
          <p>
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrainerRegister;
