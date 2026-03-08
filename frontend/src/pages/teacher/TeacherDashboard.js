import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', class: '', dueDate: '' });
  const [file, setFile] = useState(null);
  const [filterClass, setFilterClass] = useState('');

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get('/api/assignments');
      setAssignments(data);
    } catch {
      toast.error('Failed to load assignments');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append('file', file);

    try {
      await axios.post('/api/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Assignment uploaded!');
      setShowModal(false);
      setForm({ title: '', description: '', subject: '', class: '', dueDate: '' });
      setFile(null);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await axios.delete(`/api/assignments/${id}`);
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const myAssignments = assignments.filter(a => a.uploadedBy === user.id || a.teacherName === user.name);
  const filtered = filterClass ? myAssignments.filter(a => a.class === Number(filterClass)) : myAssignments;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <p>Welcome, {user.name}! Upload and manage your assignments here.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{myAssignments.length}</div><div className="label">My Assignments</div></div>
        <div className="stat-card"><div className="num">{[...new Set(myAssignments.map(a => a.class))].length}</div><div className="label">Classes Covered</div></div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h2 className="section-title" style={{ margin: 0 }}>My Assignments</h2>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '2px solid #e0e0e0' }}>
          <option value="">All Classes</option>
          {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Class {i + 1}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>+ Upload Assignment</button>
      </div>

      {loading ? <div className="loading">Loading...</div> :
        filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><p>No assignments yet. Upload your first one!</p></div>
        ) : (
          filtered.map(a => (
            <div key={a._id} className="card">
              <div className="card-header">
                <div>
                  <h3>{a.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    <span className="badge badge-class">Class {a.class}</span>
                    <span className="badge badge-subject">{a.subject}</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}>Delete</button>
              </div>
              {a.description && <p>{a.description}</p>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {a.dueDate && <span style={{ color: '#888', fontSize: '0.85rem' }}>📅 Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                {a.filePath && (
                  <a href={`http://localhost:5000/${a.filePath}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⬇ View File ({a.fileName})</a>
                )}
                <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: 'auto' }}>
                  {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))
        )
      }

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Upload Assignment</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Assignment title" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="e.g. Mathematics" />
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} required>
                    <option value="">Select Class</option>
                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Class {i + 1}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2" placeholder="Brief description..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date (optional)</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Attach File (optional, max 10MB)</label>
                  <input type="file" onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;