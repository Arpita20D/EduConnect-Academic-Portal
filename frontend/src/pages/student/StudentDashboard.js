import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('assignments');
  const [filterSubject, setFilterSubject] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, nRes] = await Promise.all([
          axios.get('/api/assignments'),
          axios.get('/api/notifications')
        ]);
        setAssignments(aRes.data);
        setNotifications(nRes.data.slice(0, 5));
      } catch {
        toast.error('Failed to load data');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const subjects = [...new Set(assignments.map(a => a.subject))];
  const filtered = filterSubject ? assignments.filter(a => a.subject === filterSubject) : assignments;

  const isOverdue = (date) => date && new Date(date) < new Date();

  const typeLabel = { general: '📢', exam: '📝', holiday: '🌴', event: '🎉', urgent: '🚨' };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p>Welcome, {user.name}! You are enrolled in <strong>Class {user.class}</strong>.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">Total Assignments</div></div>
        <div className="stat-card"><div className="num">{subjects.length}</div><div className="label">Subjects</div></div>
        <div className="stat-card"><div className="num">{assignments.filter(a => a.filePath).length}</div><div className="label">With Files</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📚 Assignments</button>
        <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>🔔 Latest Notices</button>
      </div>

      {tab === 'assignments' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#666' }}>Filter by subject:</span>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '2px solid #e0e0e0' }}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? <div className="loading">Loading assignments...</div> :
            filtered.length === 0 ? (
              <div className="empty-state"><div className="icon">📚</div><p>No assignments for Class {user.class} yet.</p></div>
            ) : (
              filtered.map(a => (
                <div key={a._id} className="card">
                  <div className="card-header">
                    <div>
                      <h3>{a.title}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span className="badge badge-subject">{a.subject}</span>
                        <span className="badge badge-class">Class {a.class}</span>
                        {a.dueDate && isOverdue(a.dueDate) && (
                          <span className="badge badge-urgent">OVERDUE</span>
                        )}
                      </div>
                    </div>
                    {a.filePath && (
                      <a href={`http://localhost:5000/${a.filePath}`} download target="_blank" rel="noreferrer" className="btn btn-success btn-sm">⬇ Download</a>
                    )}
                  </div>
                  {a.description && <p style={{ color: '#555', margin: '0.5rem 0' }}>{a.description}</p>}
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: '#888', flexWrap: 'wrap' }}>
                    <span>👨‍🏫 {a.teacherName}</span>
                    {a.dueDate && <span>📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    <span>📌 Posted: {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    {a.fileName && <span>📎 {a.fileName}</span>}
                  </div>
                </div>
              ))
            )
          }
        </div>
      )}

      {tab === 'notifications' && (
        <div>
          {notifications.length === 0 ? (
            <div className="empty-state"><div className="icon">🔔</div><p>No notifications.</p></div>
          ) : (
            notifications.map(n => (
              <div key={n._id} className={`notif-card ${n.type}`}>
                <h3>{typeLabel[n.type]} {n.title}</h3>
                <span className={`badge badge-${n.type}`}>{n.type.toUpperCase()}</span>
                <p style={{ margin: '0.8rem 0', color: '#444' }}>{n.message}</p>
                <p className="notif-meta">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;