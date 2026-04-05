import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { fileUrl } from '../../utils/fileUrl';

const StudentDashboard = () => {
  const { user } = useAuth();

  // ── Assignments state ──
  const [assignments,   setAssignments]   = useState([]);
  const [assLoading,    setAssLoading]    = useState(true);
  const [filterSubject, setFilterSubject] = useState('');

  // ── Notifications state ──
  const [notifications, setNotifications] = useState([]);
  const [notifLoading,  setNotifLoading]  = useState(true);

  // ── Attendance state ──
  const [attRecords,  setAttRecords]  = useState([]);
  const [attLoading,  setAttLoading]  = useState(false);
  const [attMonth,    setAttMonth]    = useState('');
  const [attSearched, setAttSearched] = useState(false);

  // ── Results (report cards) state ──
  const [reportCards, setReportCards] = useState([]);
  const [rcLoading,   setRcLoading]   = useState(true);

  const [tab, setTab] = useState('assignments');

  // Load assignments for this student's class
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/assignments/public');
        setAssignments(data.filter(a => a.class === Number(user.class)));
      } catch {
        toast.error('Failed to load assignments');
      }
      setAssLoading(false);
    };
    load();
  }, [user.class]);

  // Load notifications
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/notifications');
        setNotifications(data);
      } catch {
        toast.error('Failed to load notifications');
      }
      setNotifLoading(false);
    };
    load();
  }, []);

  // Load report cards for this student (matched by name + class)
  // Students with a login account have their name stored in user.name
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(
          `/api/reportcards/public?studentName=${encodeURIComponent(user.name)}&class=${user.class}`
        );
        setReportCards(data);
      } catch {
        // Silently fail — not every student will have report cards
      }
      setRcLoading(false);
    };
    load();
  }, [user.name, user.class]);

  // Load attendance for this student by month
  const loadAttendance = async (month) => {
    setAttLoading(true);
    try {
      const params = new URLSearchParams({
        studentName: user.name,
        class: user.class,
      });
      if (month) params.append('month', month);
      const { data } = await axios.get(`/api/attendance/public?${params}`);
      setAttRecords(data);
      setAttSearched(true);
    } catch {
      toast.error('Failed to load attendance');
    }
    setAttLoading(false);
  };

  // Derived values
  const subjects  = [...new Set(assignments.map(a => a.subject))];
  const filtered  = filterSubject ? assignments.filter(a => a.subject === filterSubject) : assignments;
  const isOverdue = (date) => date && new Date(date) < new Date();
  const typeLabel = { general: '📢', exam: '📝', holiday: '🌴', event: '🎉', urgent: '🚨' };

  // Attendance summary
  const totalPresent = attRecords.reduce((s, r) => s + r.daysPresent, 0);
  const totalDaysAll = attRecords.reduce((s, r) => s + r.totalDays, 0);
  const overallPct   = totalDaysAll > 0 ? Math.round((totalPresent / totalDaysAll) * 100) : null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🎓 Student Dashboard</h1>
        <p>Welcome, <strong>{user.name}</strong>! You are in <strong>Class {user.class}</strong>.</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="num">{assignments.length}</div>
          <div className="label">Assignments</div>
        </div>
        <div className="stat-card">
          <div className="num">{subjects.length}</div>
          <div className="label">Subjects</div>
        </div>
        <div className="stat-card">
          <div className="num">{reportCards.length}</div>
          <div className="label">Result Cards</div>
        </div>
        <div className="stat-card">
          <div className="num">{overallPct !== null ? `${overallPct}%` : '—'}</div>
          <div className="label">Attendance</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'assignments'   ? 'active' : ''}`} onClick={() => setTab('assignments')}>📚 Assignments</button>
        <button className={`tab ${tab === 'attendance'    ? 'active' : ''}`} onClick={() => setTab('attendance')}>📊 My Attendance</button>
        <button className={`tab ${tab === 'results'       ? 'active' : ''}`} onClick={() => setTab('results')}>📄 My Results</button>
        <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>🔔 Notices</button>
      </div>

      {/* ── Assignments Tab ── */}
      {tab === 'assignments' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#666' }}>Filter by subject:</span>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '2px solid #e0e0e0' }}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {filterSubject && (
              <button className="btn btn-secondary btn-sm" onClick={() => setFilterSubject('')}>✕ Clear</button>
            )}
          </div>

          {assLoading ? (
            <div className="loading">Loading assignments...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📚</div>
              <p>No assignments for Class {user.class} yet.</p>
            </div>
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
                    <a
                      href={fileUrl(a.filePath)}
                      download target="_blank" rel="noreferrer"
                      className="btn btn-success btn-sm"
                    >
                      ⬇ Download PDF
                    </a>
                  )}
                </div>
                {a.description && (
                  <p style={{ color: '#555', margin: '0.5rem 0', lineHeight: 1.6 }}>{a.description}</p>
                )}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: '#888', flexWrap: 'wrap' }}>
                  <span>👨‍🏫 {a.teacherName}</span>
                  {a.dueDate && (
                    <span>📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                  <span>📌 Posted: {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {a.fileName && <span>📎 {a.fileName}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Attendance Tab ── */}
      {tab === 'attendance' && (
        <div>
          {/* Filter by month */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#1a237e', marginBottom: '1rem' }}>📊 My Monthly Attendance</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
                <label>Filter by Month (optional)</label>
                <input
                  type="month"
                  value={attMonth}
                  onChange={e => setAttMonth(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={() => loadAttendance(attMonth)}>
                {attLoading ? 'Loading...' : 'Search'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setAttMonth(''); loadAttendance(''); }}
              >
                Show All
              </button>
            </div>
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.8rem', marginBottom: 0 }}>
              Leave month blank and click "Show All" to see your complete attendance record.
            </p>
          </div>

          {/* Overall summary */}
          {attSearched && attRecords.length > 0 && (
            <div className="card" style={{ background: 'linear-gradient(135deg,#1a237e,#3949ab)', color: 'white', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>Overall Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                {[
                  ['Total Days', totalDaysAll, 'rgba(255,255,255,0.15)'],
                  ['Present',    totalPresent, 'rgba(46,125,50,0.4)'],
                  ['Absent',     totalDaysAll - totalPresent, 'rgba(198,40,40,0.4)'],
                ].map(([label, val, bg]) => (
                  <div key={label} style={{ textAlign: 'center', background: bg, borderRadius: 10, padding: '0.8rem' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{val}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{label}</div>
                  </div>
                ))}
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '0.8rem' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{overallPct}%</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Attendance %</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                <div style={{
                  width: `${overallPct}%`, height: '100%', borderRadius: 20,
                  background: overallPct >= 75 ? '#66bb6a' : overallPct >= 50 ? '#ffa726' : '#ef5350',
                  transition: 'width 0.4s'
                }} />
              </div>
              <p style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.4rem' }}>
                {overallPct >= 75 ? '✅ Good attendance' : overallPct >= 50 ? '⚠️ Needs improvement' : '❌ Critically low attendance'}
              </p>
            </div>
          )}

          {/* Month-by-month table */}
          {attLoading ? (
            <div className="loading">Loading attendance...</div>
          ) : !attSearched ? (
            <div className="empty-state">
              <div className="icon">📊</div>
              <p>Click "Show All" to see your attendance, or pick a month and click "Search".</p>
            </div>
          ) : attRecords.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <p>No attendance records found yet. Your teacher may not have uploaded attendance yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Days</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance %</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attRecords.map(r => {
                    const pct = Math.round((r.daysPresent / r.totalDays) * 100);
                    const col = pct >= 75 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
                    const ml  = new Date(r.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                    return (
                      <tr key={r._id}>
                        <td><strong>{ml}</strong></td>
                        <td style={{ textAlign: 'center' }}>{r.totalDays}</td>
                        <td style={{ textAlign: 'center', color: '#2e7d32', fontWeight: 600 }}>{r.daysPresent}</td>
                        <td style={{ textAlign: 'center', color: '#c62828', fontWeight: 600 }}>{r.daysAbsent}</td>
                        <td style={{ textAlign: 'center', color: '#e65100', fontWeight: 600 }}>{r.daysLate || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: col }}>
                          {pct}%
                          <div style={{ height: 5, background: '#eee', borderRadius: 10, marginTop: 3 }}>
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

      {/* ── Results Tab ── */}
      {tab === 'results' && (
        <div>
          {rcLoading ? (
            <div className="loading">Loading results...</div>
          ) : reportCards.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📄</div>
              <p>No result cards uploaded for you yet.</p>
              <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.4rem' }}>
                Your teacher will upload your result cards here after exams.
              </p>
            </div>
          ) : (
            reportCards.map(c => (
              <div key={c._id} className="card">
                <div className="card-header">
                  <div>
                    <h3>📄 {c.term}</h3>
                    <span className="badge badge-class">Class {c.class}</span>
                  </div>
                  <a
                    href={fileUrl(c.filePath)}
                    target="_blank" rel="noreferrer"
                    className="btn btn-success btn-sm"
                  >
                    ⬇ Download PDF
                  </a>
                </div>
                {c.remarks && (
                  <p style={{ color: '#555', marginTop: '0.5rem' }}>📝 {c.remarks}</p>
                )}
                <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                  Uploaded by {c.teacherName} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {tab === 'notifications' && (
        <div>
          {notifLoading ? (
            <div className="loading">Loading notices...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔔</div>
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n._id} className={`notif-card ${n.type}`}>
                <h3>{typeLabel[n.type]} {n.title}</h3>
                <span className={`badge badge-${n.type}`}>{n.type.toUpperCase()}</span>
                <p style={{ margin: '0.8rem 0', color: '#444' }}>{n.message}</p>
                <p className="notif-meta">
                  {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;