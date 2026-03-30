import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('attendance');

  // ── Attendance state ──
  const [attRecords, setAttRecords] = useState([]);
  const [attMonth, setAttMonth] = useState('');
  const [attLoading, setAttLoading] = useState(false);

  // ── Report Cards state ──
  const [reportCards, setReportCards] = useState([]);
  const [rcLoading, setRcLoading] = useState(false);

  // ── Assignments state ──
  const [assignments, setAssignments] = useState([]);
  const [assLoading, setAssLoading] = useState(false);

  // ── Notifications state ──
  const [notifications, setNotifications] = useState([]);

  const childName = user.childName;
  const childClass = user.childClass;

  // Load attendance
  const loadAttendance = async (month) => {
    if (!childName || !childClass) return;
    setAttLoading(true);
    try {
      const params = new URLSearchParams({ studentName: childName, class: childClass });
      if (month) params.append('month', month);
      const { data } = await axios.get(`/api/attendance/public?${params}`);
      setAttRecords(data);
    } catch { toast.error('Failed to load attendance'); }
    setAttLoading(false);
  };

  // Load report cards
  const loadReportCards = async () => {
    if (!childName || !childClass) return;
    setRcLoading(true);
    try {
      const { data } = await axios.get(`/api/reportcards/public?studentName=${encodeURIComponent(childName)}&class=${childClass}`);
      setReportCards(data);
    } catch { toast.error('Failed to load report cards'); }
    setRcLoading(false);
  };

  // Load assignments for child's class
  const loadAssignments = async () => {
    if (!childClass) return;
    setAssLoading(true);
    try {
      const { data } = await axios.get('/api/assignments/public');
      setAssignments(data.filter(a => a.class === Number(childClass)));
    } catch { toast.error('Failed to load assignments'); }
    setAssLoading(false);
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
    } catch {}
  };

  useEffect(() => {
    loadAttendance('');
    loadReportCards();
    loadAssignments();
    loadNotifications();
  }, []);

  // Attendance summary
  const total = attRecords.length;
  const present = attRecords.filter(r => r.status === 'Present').length;
  const absent = attRecords.filter(r => r.status === 'Absent').length;
  const late = attRecords.filter(r => r.status === 'Late').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const statusColor = { Present: '#2e7d32', Absent: '#c62828', Late: '#e65100' };
  const statusBg   = { Present: '#e8f5e9', Absent: '#ffebee', Late: '#fff3e0' };
  const typeIcon   = { general: '📢', exam: '📝', holiday: '🌴', event: '🎉', urgent: '🚨' };

  if (!childName || !childClass) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <div className="icon">⚠️</div>
          <p>Your account is not linked to a child yet. Please contact the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👨‍👩‍👧 Parent Dashboard</h1>
        <p>Welcome, {user.name}! Viewing details for <strong>{childName}</strong> — <strong>Class {childClass}</strong></p>
      </div>

      {/* Quick stats */}
      <div className="stats-row">
        <div className="stat-card"><div className="num">{pct}%</div><div className="label">Attendance</div></div>
        <div className="stat-card"><div className="num">{reportCards.length}</div><div className="label">Report Cards</div></div>
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">Assignments</div></div>
        <div className="stat-card"><div className="num">{notifications.length}</div><div className="label">Notices</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>📊 Attendance</button>
        <button className={`tab ${tab === 'reportcards' ? 'active' : ''}`} onClick={() => setTab('reportcards')}>📄 Report Cards</button>
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📚 Assignments</button>
        <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>🔔 Notices</button>
      </div>

      {/* ── Attendance Tab ── */}
      {tab === 'attendance' && (
        <div>
          {/* Month filter */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
                <label>Filter by Month</label>
                <input type="month" value={attMonth} onChange={e => setAttMonth(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={() => loadAttendance(attMonth)}>Search</button>
              <button className="btn btn-secondary" onClick={() => { setAttMonth(''); loadAttendance(''); }}>Show All</button>
            </div>
          </div>

          {/* Summary */}
          {total > 0 && (
            <div className="card" style={{ background: 'linear-gradient(135deg,#1a237e,#3949ab)', color: 'white', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>Attendance Summary — {childName}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                {[['Total', total, 'rgba(255,255,255,0.15)'], ['Present', present, 'rgba(46,125,50,0.4)'],
                  ['Absent', absent, 'rgba(198,40,40,0.4)'], ['Late', late, 'rgba(230,81,0,0.4)'],
                  [`${pct}%`, null, 'rgba(255,255,255,0.15)']].map(([label, val, bg], i) => (
                  <div key={i} style={{ textAlign: 'center', background: bg, borderRadius: 10, padding: '0.8rem' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{val !== null ? val : label}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{val !== null ? label : 'Attendance %'}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 20, background: pct >= 75 ? '#66bb6a' : pct >= 50 ? '#ffa726' : '#ef5350', transition: 'width 0.4s' }} />
              </div>
              <p style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.4rem' }}>
                {pct >= 75 ? '✅ Good attendance' : pct >= 50 ? '⚠️ Needs improvement' : '❌ Critically low attendance'}
              </p>
            </div>
          )}

          {attLoading ? <div className="loading">Loading...</div> : attRecords.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No attendance records found yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Remark</th></tr></thead>
                <tbody>
                  {attRecords.map(r => (
                    <tr key={r._id}>
                      <td>{new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ color: '#888', fontSize: '0.85rem' }}>
                        {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                      </td>
                      <td>
                        <span style={{ padding: '0.2rem 0.7rem', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem',
                          color: statusColor[r.status], background: statusBg[r.status] }}>
                          {r.status === 'Present' ? '✔' : r.status === 'Absent' ? '✘' : '⏱'} {r.status}
                        </span>
                      </td>
                      <td style={{ color: '#666', fontSize: '0.9rem' }}>{r.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Report Cards Tab ── */}
      {tab === 'reportcards' && (
        <div>
          {rcLoading ? <div className="loading">Loading...</div> : reportCards.length === 0 ? (
            <div className="empty-state"><div className="icon">📄</div><p>No report cards uploaded yet.</p></div>
          ) : reportCards.map(c => (
            <div key={c._id} className="card">
              <div className="card-header">
                <div>
                  <h3>📄 {c.term}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <span className="badge badge-class">Class {c.class}</span>
                    <span className="badge badge-subject">{c.studentName}</span>
                  </div>
                </div>
                <a href={`/uploads/${c.filePath.replace(/\\/g, '/').split('uploads/')[1]}`}
                  target="_blank" rel="noreferrer" className="btn btn-success btn-sm">⬇ Download PDF</a>
              </div>
              {c.remarks && <p style={{ color: '#555', marginTop: '0.5rem' }}>📝 {c.remarks}</p>}
              <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                Uploaded by {c.teacherName} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Assignments Tab ── */}
      {tab === 'assignments' && (
        <div>
          {assLoading ? <div className="loading">Loading...</div> : assignments.length === 0 ? (
            <div className="empty-state"><div className="icon">📚</div><p>No assignments for Class {childClass} yet.</p></div>
          ) : assignments.map(a => (
            <div key={a._id} className="card">
              <div className="card-header">
                <div>
                  <h3>{a.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-subject">{a.subject}</span>
                    <span className="badge badge-class">Class {a.class}</span>
                  </div>
                </div>
                {a.filePath && (
                  <a href={`/uploads/${a.filePath.replace(/\\/g, '/').split('uploads/')[1]}`}
                    target="_blank" rel="noreferrer" className="btn btn-success btn-sm">⬇ PDF</a>
                )}
              </div>
              {a.description && <p style={{ color: '#555', marginTop: '0.5rem' }}>{a.description}</p>}
              <p style={{ color: '#888', fontSize: '0.83rem', marginTop: '0.5rem' }}>
                👨‍🏫 {a.teacherName}
                {a.dueDate && <span> · 📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {tab === 'notifications' && (
        <div>
          {notifications.length === 0 ? (
            <div className="empty-state"><div className="icon">🔔</div><p>No notifications yet.</p></div>
          ) : notifications.map(n => (
            <div key={n._id} className={`notif-card ${n.type}`}>
              <h3>{typeIcon[n.type]} {n.title}</h3>
              <span className={`badge badge-${n.type}`}>{n.type.toUpperCase()}</span>
              <p style={{ margin: '0.8rem 0', color: '#444' }}>{n.message}</p>
              <p className="notif-meta">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;