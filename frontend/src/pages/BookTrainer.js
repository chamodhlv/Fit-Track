import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api, { publicTrainersAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TrainerCard = ({ trainer, onSelect }) => (
  <div className="trainer-card">
    <div className="trainer-card-header">
      <div>
        {trainer.profileImage ? (
          <img src={trainer.profileImage} alt={trainer.fullName} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eee' }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0 }}>{trainer.fullName}</h4>
        <div style={{ marginTop: 2, fontSize: 13, color: '#666' }}>{trainer.bio?.slice(0, 80)}{trainer.bio?.length > 80 ? '...' : ''}</div>
      </div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '0.5rem' }}>
      {trainer.specialties?.map(s => (
        <span key={s} className="specialty-tag">{s}</span>
      ))}
    </div>
    <div className="trainer-card-footer">
      <div><strong>LKR {trainer.sessionRate}/Per Session</strong></div>
      <button className="btn btn-primary" onClick={() => onSelect(trainer)}>View & Book</button>
    </div>
  </div>
);

const BookingRow = ({ b, onDownload }) => (
  <tr>
    <td>{b.trainer?.fullName}</td>
    <td>{b.date}</td>
    <td>LKR {b.amount}</td>
    <td className="text-right">
      <button className="btn btn-sm" onClick={() => onDownload(b._id)}>Download PDF</button>
    </td>
  </tr>
);

const BookTrainer = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [tPage, setTPage] = useState(1);
  const [tTotalPages, setTTotalPages] = useState(1);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedTrainerLoading, setSelectedTrainerLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const [bookings, setBookings] = useState([]);
  const [bPage, setBPage] = useState(1);
  const [bTotalPages, setBTotalPages] = useState(1);
  const [bLoading, setBLoading] = useState(true);

  useEffect(() => {
    loadTrainers();
  }, [tPage]);

  useEffect(() => {
    if (isAuthenticated) loadBookings();
  }, [bPage, isAuthenticated]);

  const loadTrainers = async () => {
    try {
      setLoading(true);
      const { data } = await publicTrainersAPI.list(tPage, 6);
      setTTotalPages(data.totalPages || 1);
      setTrainers(data.trainers || []);
    } catch (e) {
      toast.error('Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBLoading(true);
      const { data } = await bookingsAPI.myBookings(bPage, 5);
      setBookings(data.bookings || []);
      setBTotalPages(data.totalPages || 1);
    } catch (e) {
      toast.error('Failed to load your bookings');
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
      <h1 style={{ marginBottom: '1rem' }}>Book a Trainer</h1>

      {/* Previous Bookings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Your Previous Bookings</h3>
        {bLoading ? (
          <div className="loading"><div className="spinner"/></div>
        ) : bookings.length === 0 ? (
          <p>No bookings yet.</p>
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

      {/* Browse Trainers */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Browse Personal Trainers</h3>
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
          <div className="pagination" style={{ marginTop: '1rem' }}>
            <button onClick={() => setTPage(p => Math.max(1, p - 1))} disabled={tPage === 1}>Previous</button>
            <span>Page {tPage} of {tTotalPages}</span>
            <button onClick={() => setTPage(p => Math.min(tTotalPages, p + 1))} disabled={tPage === tTotalPages}>Next</button>
          </div>
        )}
      </div>

      {/* Selected trainer modal-ish section */}
      {selectedTrainer && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>Book {selectedTrainer.fullName}</h3>
              <button className="close-btn" onClick={() => setSelectedTrainer(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedTrainerLoading ? (
                <div className="loading"><div className="spinner"/></div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div>
                      {selectedTrainer.profileImage ? (
                        <img src={selectedTrainer.profileImage} alt={selectedTrainer.fullName} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#eee' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ marginTop: 0 }}><strong>Rate:</strong> LKR {selectedTrainer.sessionRate}/Per Session</p>
                      <p style={{ whiteSpace: 'pre-wrap' }}><strong>Bio:</strong> {selectedTrainer.bio || 'No bio provided.'}</p>
                      <div style={{ marginTop: 6 }}>
                        <strong>Specialties:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {selectedTrainer.specialties?.map((s) => (
                            <span key={s} className="specialty-tag">{s}</span>
                          ))}
                        </div>
                      </div>
                      {selectedTrainer.availability?.timeSlots?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <strong>Available Time Slots:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {selectedTrainer.availability.timeSlots.map(ts => (
                              <span key={`${ts.start}-${ts.end}`} className="time-slot">{ts.start} - {ts.end}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <strong>Location:</strong> Fit-Track GYM
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Select Date</label>
                <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTrainer(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBook}>Book Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTrainer;
