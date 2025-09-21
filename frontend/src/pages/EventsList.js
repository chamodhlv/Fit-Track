import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EventsList = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const fetchEvents = async (p = page) => {
    try {
      setLoading(true);
      const res = await eventsAPI.list(p, 12);
      setEvents(res.data.events || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleToggleAttendance = async (id) => {
    try {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      const res = await eventsAPI.toggleAttendance(id);
      setEvents((prev) => prev.map((e) => e._id === id ? { ...e, attending: res.data.attending, attendeeCount: res.data.attendeeCount } : e));
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

  return (
    <div className="container">
      <div className="events-hero">
        <h1>Upcoming Events</h1>
        <p>Join our fitness community events and connect with fellow members</p>
      </div>

      {events.length === 0 ? (
        <div className="card text-center">
          <h3>No events found</h3>
          <p>Please check back later for upcoming events.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((ev) => (
            <div key={ev._id} className="event-card">
              {ev.image ? (
                <img src={ev.image} alt={ev.name} className="event-card-image" />
              ) : (
                <div className="event-card-image">🎉</div>
              )}
              
              <div className="event-card-content">
                <h3 className="event-card-title">{ev.name}</h3>
                
                <div className="event-card-meta">
                  <div className="event-meta-item">
                    <span className="event-meta-icon">📍</span>
                    <span>{ev.location}</span>
                  </div>
                  {ev.date && (
                    <div className="event-meta-item">
                      <span className="event-meta-icon">📅</span>
                      <span>{formatDate(ev.date)}</span>
                    </div>
                  )}
                  {ev.time && (
                    <div className="event-meta-item">
                      <span className="event-meta-icon">🕐</span>
                      <span>{formatTime(ev.time)}</span>
                    </div>
                  )}
                </div>

                {Array.isArray(ev.guests) && ev.guests.length > 0 && (
                  <div className="event-guests">
                    <div className="event-guests-title">Special Guests</div>
                    <ul className="event-guests-list">
                      {ev.guests.map((g, idx) => (
                        <li key={idx}>{g.name} — {g.qualification}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="event-card-description">
                  {ev.description?.length > 120 ? ev.description.slice(0, 120) + '…' : ev.description}
                </p>

                <div className="event-card-footer">
                  <div className="event-actions">
                    <button 
                      className={ev.attending ? 'btn btn-success' : 'btn btn-primary'} 
                      onClick={() => handleToggleAttendance(ev._id)}
                    >
                      {ev.attending ? '✓ Attending' : 'Mark Attendance'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => navigate(`/events/${ev._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                  <div className="event-attendance-info">
                    <span className="event-meta-icon">👥</span>
                    <span><strong>{ev.attendeeCount}</strong> attending</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

export default EventsList;
