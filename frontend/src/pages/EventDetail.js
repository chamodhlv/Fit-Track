import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await eventsAPI.getById(id);
      setEvent(res.data);
    } catch (error) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleAttendance = async () => {
    try {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      const res = await eventsAPI.toggleAttendance(id);
      setEvent((prev) => prev ? { ...prev, attending: res.data.attending, attendeeCount: res.data.attendeeCount } : prev);
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body">
            <h3>Event not found</h3>
            <p>The event you're looking for doesn't exist or has been removed.</p>
            <button className="btn btn-primary" onClick={() => navigate('/events')}>
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="event-detail-hero">
        {event.image ? (
          <img src={event.image} alt={event.name} className="event-detail-image" />
        ) : (
          <div style={{ 
            height: '300px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem'
          }}>
            🎉
          </div>
        )}
        <div className="event-detail-overlay">
          <h1 className="event-detail-title">{event.name}</h1>
          <div className="event-detail-meta">
            <div className="event-detail-meta-item">
              <span>📍</span>
              <span>{event.location}</span>
            </div>
            {event.date && (
              <div className="event-detail-meta-item">
                <span>📅</span>
                <span>{formatDate(event.date)}</span>
              </div>
            )}
            {event.time && (
              <div className="event-detail-meta-item">
                <span>🕐</span>
                <span>{formatTime(event.time)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="event-detail-content">
        <div className="event-detail-main">
          <h2 style={{ marginBottom: '1rem', color: '#374151' }}>About This Event</h2>
          <div className="event-description">{event.description}</div>
        </div>

        <div className="event-detail-sidebar">
          {/* Attendance Card */}
          <div className="event-detail-card event-attendance-card">
            <div className="event-detail-card-title">
              <span>👥</span>
              <span>Attendance</span>
            </div>
            <div className="event-attendance-count">{event.attendeeCount}</div>
            <div className="event-attendance-label">people attending</div>
            <button 
              className={event.attending ? 'btn btn-success' : 'btn btn-primary'} 
              onClick={handleToggleAttendance}
              style={{ width: '100%' }}
            >
              {event.attending ? '✓ You\'re Attending' : 'Mark Attendance'}
            </button>
          </div>

          {/* Special Guests Card */}
          {Array.isArray(event.guests) && event.guests.length > 0 && (
            <div className="event-detail-card">
              <div className="event-detail-card-title">
                <span>⭐</span>
                <span>Special Guests</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {event.guests.map((guest, idx) => (
                  <div key={idx} style={{ 
                    padding: '0.75rem', 
                    background: '#f8fafc', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                      {guest.name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {guest.qualification}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EventDetail;
