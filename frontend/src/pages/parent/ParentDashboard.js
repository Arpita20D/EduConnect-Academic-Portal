import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('attendance');
  const [attRecords,   setAttRecords]   = useState([]);
  const [attMonth,     setAttMonth]     = useState('');
  const [attLoading,   setAttLoading]   = useState(false);
  const [reportCards,  setReportCards]  = useState([]);
  const [rcLoading,    setRcLoading]    = useState(false);
  const [assignments,  setAssignments]  = useState([]);
  const [assLoading,   setAssLoading]   = useState(false);
  const [notifications, setNotifications] = useState([]);

  const childName  = user.childName;
  const childClass = user.childClass;

  const loadAttendance = useCallback(async (month) => {
    if (!childName || !childClass) return;
    setAttLoading(true);
    try {
      const params = new URLSearchParams({ studentName: childName, class: childClass });
      if (month) params.append('month', month);
      const { data } = await axios.get(`/api/attendance/public?${params}`);
      setAttRecords(data);
    } catch { toast.error('Failed to load attendance'); }
    setAttLoading(false);
  }, [childName, childClass]);

  const loadReportCards = useCallback(async () => {
    if (!childName || !childClass) return;
    setRcLoading(true);
    try {
      const { data } = await axios.get(`/api/reportcards/public?studentName=${encodeURIComponent(childName)}&class=${childClass}`);
      setReportCards(data);
    } catch { toast.error('Failed to load results'); }
    setRcLoading(false);
  }, [childName, childClass]);

  const loadAssignments = useCallback(async () => {
    if (!childClass) return;
    setAssLoading(true);
    try {
      const { data } = await axios.get('/api/assignments/public');
      setAssignments(data.filter(a => a.class === Number(childClass)));
    } catch { toast.error('Failed to load assignments'); }
    setAssLoading(false);
  }, [childClass]);

  useEffect(() => {
    loadAttendance('');
    loadReportCards();
    loadAssignments();
    axios.get('/api/notifications').then(r => setNotifications(r.data)).catch(() => {});
  }, [loadAttendance, loadReportCards, loadAssignments]);

  const typeIcon = { general: '📢', exam: '📝', holiday: '🌴', event: '🎉', urgent: '🚨' };

  if (!childName || !childClass) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <div className="icon">⚠️</div>
          <p>Your account is not linked to a child. Please contact the admin.</p>
        </div>
      </div>
    );
  }

  // Overall attendance summary across all months
  const totalPresent  = attRecords.reduce((s, r) => s + r.daysPresent, 0);
  const totalDaysAll  = attRecords.reduce((s, r) => s + r.totalDays, 0);
  const overallPct    = totalDaysAll > 0 ? Math.round((totalPresent / totalDaysAll) * 100) : null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👨‍👩‍👧 Parent Dashboard</h1>
        <p>Welcome, <strong>{user.name}</strong>! Viewing records for <strong>{childName}</strong> — Class {childClass}.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="num">{overallPct !== null ? `${overallPct}%` : '—'}</div>
          <div className="label">Overall Attendance</div>
        </div>
        <div className="stat-card"><div className="num">{reportCards.length}</div><div className="label">Results</div></div>
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">Assignments</div></div>
        <div className="stat-card"><div className="num">{notifications.length}</div><div className="label">Notices</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'attendance'    ? 'active' : ''}`} onClick={() => setTab('attendance')}>📊 Attendance</button>
        <button className={`tab ${tab === 'results'       ? 'active' : ''}`} onClick={() => setTab('results')}>📄 Results</button>
        <button className={`tab ${tab === 'assignments'   ? 'active' : ''}`} onClick={() => setTab('assignments')}>📚 Assignments</button>
        <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>🔔 Notices</button>
      </div>

      {/* ── Attendance ── */}
      {tab === 'attendance' && (
        <div>
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

          {attLoading ? <div className="loading">Loading...</div> : attRecords.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No attendance records found yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Month</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {attRecords.map(r => {
                    const pct = Math.round((r.daysPresent / r.totalDays) * 100);
                    const col = pct >= 75 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
                    const monthLabel = new Date(r.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                    return (
                      <tr key={r._id}>
                        <td><strong>{monthLabel}</strong></td>
                        <td style={{ textAlign: 'center' }}>{r.totalDays}</td>
                        <td style={{ textAlign: 'center', color: '#2e7d32', fontWeight: 600 }}>{r.daysPresent}</td>
                        <td style={{ textAlign: 'center', color: '#c62828', fontWeight: 600 }}>{r.daysAbsent}</td>
                        <td style={{ textAlign: 'center', color: '#e65100', fontWeight: 600 }}>{r.daysLate || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: col }}>
                          {pct}%
                          <div style={{ height: 6, background: '#eee', borderRadius: 10, marginTop: 4 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 10 }} />
                          </div>
                        </td>
                        <td style={{ color: '#666', fontSize: '0.85rem' }}>{r.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {tab === 'results' && (
        <div>
          {rcLoading ? <div className="loading">Loading...</div> : reportCards.length === 0 ? (
            <div className="empty-state"><div className="icon">📄</div><p>No results uploaded yet.</p></div>
          ) : reportCards.map(c => (
            <div key={c._id} className="card">
              <div className="card-header">
                <div>
                  <h3>📄 {c.term}</h3>
                  <span className="badge badge-class">Class {c.class}</span>
                </div>
                <a href={`/uploads/${c.filePath.replace(/\\/g, '/').split('uploads/')[1]}`}
                   target="_blank" rel="noreferrer" className="btn btn-success btn-sm">⬇ Download PDF</a>
              </div>
              {c.remarks && <p style={{ color: '#555', marginTop: '0.5rem' }}>📝 {c.remarks}</p>}
              <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                By {c.teacherName} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Assignments ── */}
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
                👨‍🏫 <strong>{a.teacherName}</strong>
                {a.dueDate && <span> · 📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Notifications ── */}
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