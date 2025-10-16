import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api, { publicTrainersAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TrainerCard = ({ trainer, onSelect }) => (
  <div className="trainer-card">
    <div className="trainer-card-header">
      <div>
        {trainer.profileImage ? (
          <img src={trainer.profileImage} alt={trainer.fullName} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6' }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <h4>{trainer.fullName}</h4>
        <div>{trainer.bio?.slice(0, 60)}{trainer.bio?.length > 60 ? '...' : ''}</div>
      </div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {trainer.specialties?.slice(0, 3).map(s => (
        <span key={s} className="specialty-tag">{s}</span>
      ))}
    </div>
    <div className="trainer-card-footer">
      <div>LKR {trainer.sessionRate}</div>
      <button className="btn btn-primary" onClick={() => onSelect(trainer)}>Book</button>
    </div>
  </div>
);

const BookingRow = ({ b, onDownload }) => (
  <tr>
    <td style={{ fontWeight: 500, color: '#111827' }}>{b.trainer?.fullName}</td>
    <td style={{ color: '#6b7280' }}>{b.date}</td>
    <td style={{ fontWeight: 600, color: '#111827' }}>LKR {b.amount}</td>
    <td className="text-right">
      <button className="btn btn-sm" onClick={() => onDownload(b._id)} style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.875rem' }}>Download</button>
    </td>
  </tr>
);

const BookTrainer = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [tPage, setTPage] = useState(1);
  const [tTotalPages, setTTotalPages] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedTrainerLoading, setSelectedTrainerLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const [bookings, setBookings] = useState([]);
  const [bPage, setBPage] = useState(1);
  const [bTotalPages, setBTotalPages] = useState(1);
  const [bLoading, setBLoading] = useState(true);

  // AbortControllers for requests
  const trainersCtrlRef = useRef(null);
  const bookingsCtrlRef = useRef(null);

  useEffect(() => {
    // cancel any in-flight trainers request
    if (trainersCtrlRef.current) trainersCtrlRef.current.abort();
    const ctrl = new AbortController();
    trainersCtrlRef.current = ctrl;
    loadTrainers(ctrl.signal);
    return () => {
      ctrl.abort();
      if (trainersCtrlRef.current === ctrl) trainersCtrlRef.current = null;
    };
  }, [tPage, selectedSpecialty]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // cancel any in-flight bookings request
    if (bookingsCtrlRef.current) bookingsCtrlRef.current.abort();
    const ctrl = new AbortController();
    bookingsCtrlRef.current = ctrl;
    loadBookings(ctrl.signal);
    return () => {
      ctrl.abort();
      if (bookingsCtrlRef.current === ctrl) bookingsCtrlRef.current = null;
    };
  }, [bPage, isAuthenticated]);

  const loadTrainers = async (signal) => {
    try {
      setLoading(true);
      const { data } = await publicTrainersAPI.list(tPage, 6, { signal }, { specialty: selectedSpecialty });
      setTTotalPages(data.totalPages || 1);
      setTrainers(data.trainers || []);
    } catch (e) {
      if (e?.code !== 'ERR_CANCELED') {
        toast.error('Failed to load trainers');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (signal) => {
    try {
      setBLoading(true);
      const { data } = await bookingsAPI.myBookings(bPage, 5, { signal });
      setBookings(data.bookings || []);
      setBTotalPages(data.totalPages || 1);
    } catch (e) {
      if (e?.code !== 'ERR_CANCELED') {
        toast.error('Failed to load your bookings');
      }
    } finally {
      setBLoading(false);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a session');
      return;
    }
    if (!selectedTrainer || !selectedDate) {
      toast.error('Please select trainer and date');
      return;
    }
    // Prevent booking for past dates
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate < todayStr) {
      toast.error('Please select today or a future date');
      return;
    }
    const ok = window.confirm(`Confirm booking on ${selectedDate} with ${selectedTrainer.fullName}?`);
    if (!ok) return;
    try {
      await bookingsAPI.create(selectedTrainer._id || selectedTrainer.id, selectedDate);
      toast.success('Session booked successfully');
      setSelectedDate('');
      setSelectedTrainer(null);
      loadBookings();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Booking failed';
      toast.error(msg);
    }
  };

  const downloadReceipt = async (id) => {
    try {
      const response = await api.get(`/bookings/${id}/receipt`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-receipt-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download receipt');
    }
  };

  const selectTrainer = async (t) => {
    try {
      setSelectedTrainerLoading(true);
      const id = t._id || t.id;
      const { data } = await publicTrainersAPI.getById(id);
      setSelectedTrainer(data.trainer || t);
    } catch (e) {
      // fall back to given t
      setSelectedTrainer(t);
    } finally {
      setSelectedTrainerLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Hero Header */}
      <div className="trainer-booking-header">
        <div className="header-content">
          <h1>Find Your Perfect Trainer</h1>
          <p>Connect with certified fitness professionals to achieve your goals</p>
        </div>
      </div>

      {/* Previous Bookings */}
      {isAuthenticated && (
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Your Bookings</h3>
        {bLoading ? (
          <div className="loading"><div className="spinner"/></div>
        ) : bookings.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No bookings yet.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th className="text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <BookingRow key={b._id} b={b} onDownload={downloadReceipt} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {bTotalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setBPage(p => Math.max(1, p - 1))} disabled={bPage === 1}>Previous</button>
            <span>Page {bPage} of {bTotalPages}</span>
            <button onClick={() => setBPage(p => Math.min(bTotalPages, p + 1))} disabled={bPage === bTotalPages}>Next</button>
          </div>
        )}
      </div>
      )}

      {/* Browse Trainers */}
      <div className="card" style={{ border: '1px solid #e5e7eb', boxShadow: 'none' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>Available Trainers</h3>

        {/* Specialty Filter (blog-style chips) */}
        <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', margin: 0 }}>Filter by Specialty:</label>
            {selectedSpecialty && (
              <button
                type="button"
                onClick={() => { setSelectedSpecialty(''); setTPage(1); }}
                className="btn btn-secondary"
              >
                Reset
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {/* All */}
            <button
              onClick={() => { setSelectedSpecialty(''); setTPage(1); }}
              className={`btn ${selectedSpecialty === '' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '14px', padding: '6px 12px', border: selectedSpecialty === '' ? '2px solid #007bff' : '1px solid #ddd' }}
            >
              All
            </button>
            {['Weight Loss','Strength Training','Yoga Instructor','Bodybuilding'].map((sp) => (
              <button
                key={sp}
                onClick={() => { setSelectedSpecialty(sp); setTPage(1); }}
                className={`btn ${selectedSpecialty === sp ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '14px', padding: '6px 12px', border: selectedSpecialty === sp ? '2px solid #007bff' : '1px solid #ddd' }}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="loading"><div className="spinner"/></div>
        ) : (
          <div className="trainers-grid">
            {trainers.map(t => (
              <TrainerCard key={t._id || t.id} trainer={t} onSelect={selectTrainer} />
            ))}
          </div>
        )}
        {tTotalPages > 1 && (
          <div className="pagination" style={{ marginTop: '1.5rem' }}>
            <button onClick={() => setTPage(p => Math.max(1, p - 1))} disabled={tPage === 1}>Previous</button>
            <span>Page {tPage} of {tTotalPages}</span>
            <button onClick={() => setTPage(p => Math.min(tTotalPages, p + 1))} disabled={tPage === tTotalPages}>Next</button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedTrainer && (
        <div className="booking-modal-overlay" onClick={() => setSelectedTrainer(null)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            {selectedTrainerLoading ? (
              <div className="loading"><div className="spinner"/></div>
            ) : (
              <>
                {/* Trainer Info */}
                <div className="booking-modal-trainer">
                  <div className="trainer-avatar">
                    {selectedTrainer.profileImage ? (
                      <img src={selectedTrainer.profileImage} alt={selectedTrainer.fullName} />
                    ) : (
                      <div className="avatar-placeholder" />
                    )}
                  </div>
                  <div className="trainer-info">
                    <h3>{selectedTrainer.fullName}</h3>
                    <p className="trainer-bio">{selectedTrainer.bio || 'Certified fitness professional'}</p>
                  </div>
                  <button className="modal-close" onClick={() => setSelectedTrainer(null)}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* Session Details */}
                <div className="booking-modal-details">
                  <div className="detail-item">
                    <span className="detail-label">Session Rate</span>
                    <span className="detail-value">LKR {selectedTrainer.sessionRate}</span>
                  </div>
                  
                  {selectedTrainer.specialties?.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Specialties</span>
                      <div className="detail-tags">
                        {selectedTrainer.specialties.map((s) => (
                          <span key={s} className="detail-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedTrainer.availability?.timeSlots?.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Available Times</span>
                      <div className="detail-tags">
                        {selectedTrainer.availability.timeSlots.map(ts => (
                          <span key={`${ts.start}-${ts.end}`} className="detail-tag">{ts.start} - {ts.end}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date Selection */}
                  <div className="detail-item">
                    <label className="detail-label">Select Date</label>
                    <input
                      type="date"
                      className="booking-date-input"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="booking-modal-actions">
                  <button className="btn-modal-cancel" onClick={() => setSelectedTrainer(null)}>Cancel</button>
                  <button className="btn-modal-confirm" onClick={handleBook}>Confirm Booking</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTrainer;
