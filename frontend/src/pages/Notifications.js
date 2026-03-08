import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'general' });
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/notifications', form);
      toast.success('Notification posted!');
      setForm({ title: '', message: '', type: 'general' });
      setShowForm(false);
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await axios.delete(`/api/notifications/${id}`);
      toast.success('Deleted');
      fetchNotifications();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const typeLabel = { general: '📢', exam: '📝', holiday: '🌴', event: '🎉', urgent: '🚨' };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>🔔 School Notifications</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Notification'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h3>Post Notification</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Notification title" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="general">General</option>
                  <option value="exam">Exam</option>
                  <option value="holiday">Holiday</option>
                  <option value="event">Event</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows="3" placeholder="Write notification message..." />
            </div>
            <button type="submit" className="btn btn-success">Post Notification</button>
          </form>
        </div>
      )}

      {loading ? <div className="loading">Loading notifications...</div> :
        notifications.length === 0 ? (
          <div className="empty-state"><div className="icon">🔔</div><p>No notifications yet.</p></div>
        ) : (
          notifications.map(n => (
            <div key={n._id} className={`notif-card ${n.type}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3>{typeLabel[n.type]} {n.title}</h3>
                  <span className={`badge badge-${n.type}`}>{n.type.toUpperCase()}</span>
                </div>
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n._id)}>Delete</button>
                )}
              </div>
              <p style={{ margin: '0.8rem 0' }}>{n.message}</p>
              <p className="notif-meta">Posted by {n.adminName} · {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          ))
        )
      }
    </div>
  );
};

export default Notifications;