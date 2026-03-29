import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

// ─── Attendance Section Component ────────────────────────────────────────────
const AttendanceSection = ({ teacherUser }) => {
  const today = new Date().toISOString().split('T')[0];
  const [selClass, setSelClass] = useState('');
  const [selDate, setSelDate] = useState(today);
  const [students, setStudents] = useState([]); // [{ studentName, status, remark }]
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [knownNames, setKnownNames] = useState([]); // previously added names for this class

  // When class changes, load any known student names + today's attendance
  useEffect(() => {
    if (!selClass) return;
    loadKnownNames(selClass);
    loadAttendance(selClass, selDate);
    // eslint-disable-next-line
  }, [selClass]);

  // When date changes, reload attendance
  useEffect(() => {
    if (!selClass) return;
    loadAttendance(selClass, selDate);
    // eslint-disable-next-line
  }, [selDate]);

  const loadKnownNames = async (cls) => {
    try {
      const { data } = await axios.get(`/api/attendance/students?class=${cls}`);
      setKnownNames(data);
    } catch { /* silent */ }
  };

  const loadAttendance = async (cls, date) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/attendance/class?class=${cls}&date=${date}`);
      if (data.length > 0) {
        // Records already exist for this date — load them
        setStudents(data.map(r => ({ studentName: r.studentName, status: r.status, remark: r.remark || '' })));
      } else {
        // No records yet — keep current student list but reset statuses
        setStudents(prev =>
          prev.length > 0
            ? prev.map(s => ({ ...s, status: 'Present', remark: '' }))
            : []
        );
      }
    } catch {
      toast.error('Could not load attendance');
    }
    setLoading(false);
  };

  const addStudent = () => {
    const name = newName.trim();
    if (!name) return;
    if (students.find(s => s.studentName.toLowerCase() === name.toLowerCase())) {
      toast.error('Student already in list');
      return;
    }
    setStudents(prev => [...prev, { studentName: name, status: 'Present', remark: '' }]);
    setNewName('');
  };

  const addKnownName = (name) => {
    if (students.find(s => s.studentName.toLowerCase() === name.toLowerCase())) return;
    setStudents(prev => [...prev, { studentName: name, status: 'Present', remark: '' }]);
  };

  const removeStudent = (idx) => {
    setStudents(prev => prev.filter((_, i) => i !== idx));
  };

  const updateField = (idx, field, val) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!selClass) return toast.error('Select a class first');
    if (students.length === 0) return toast.error('Add at least one student');
    setSaving(true);
    try {
      await axios.post('/api/attendance/bulk', {
        date: selDate,
        class: Number(selClass),
        students,
      });
      toast.success(`Attendance saved for Class ${selClass} on ${selDate}`);
      loadKnownNames(selClass);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const lateCount = students.filter(s => s.status === 'Late').length;

  // Suggestions = knownNames not yet in students list
  const suggestions = knownNames.filter(n => !students.find(s => s.studentName.toLowerCase() === n.toLowerCase()));

  return (
    <div>
      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📖 Select Class</label>
            <select value={selClass} onChange={e => { setSelClass(e.target.value); setStudents([]); }}>
              <option value="">— Choose Class —</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Class {i + 1}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📅 Date</label>
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} max={today} />
          </div>
        </div>
      </div>

      {!selClass && (
        <div className="empty-state"><div className="icon">📋</div><p>Select a class to manage attendance.</p></div>
      )}

      {selClass && (
        <>
          {/* Add students */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="section-title" style={{ marginTop: 0 }}>Add Students to Register</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStudent())}
                placeholder="Type student name and press Add"
                style={{ flex: 1, minWidth: 200, padding: '0.6rem 1rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem' }}
              />
              <button className="btn btn-primary" onClick={addStudent}>+ Add</button>
            </div>

            {/* Quick-add from known names */}
            {suggestions.length > 0 && (
              <div style={{ marginTop: '0.8rem' }}>
                <p style={{ fontSize: '0.83rem', color: '#888', marginBottom: '0.4rem' }}>Previously added students (click to add):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {suggestions.map(n => (
                    <button
                      key={n}
                      onClick={() => addKnownName(n)}
                      style={{ padding: '0.25rem 0.7rem', borderRadius: 20, border: '1.5px solid #3949ab', background: 'white', color: '#3949ab', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      + {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attendance table */}
          {loading ? (
            <div className="loading">Loading attendance...</div>
          ) : students.length === 0 ? (
            <div className="empty-state"><div className="icon">🧑‍🎓</div><p>No students added yet. Type names above to start.</p></div>
          ) : (
            <>
              {/* Summary + bulk actions */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>
                  <strong style={{ color: '#2e7d32' }}>✔ {presentCount} Present</strong> &nbsp;
                  <strong style={{ color: '#c62828' }}>✘ {absentCount} Absent</strong> &nbsp;
                  <strong style={{ color: '#e65100' }}>⏱ {lateCount} Late</strong>
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-success btn-sm" onClick={() => markAll('Present')}>All Present</button>
                  <button className="btn btn-danger btn-sm" onClick={() => markAll('Absent')}>All Absent</button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Remark (optional)</th>
                      <th>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#888', width: 40 }}>{idx + 1}</td>
                        <td><strong>{s.studentName}</strong></td>
                        <td>
                          <select
                            value={s.status}
                            onChange={e => updateField(idx, 'status', e.target.value)}
                            style={{
                              padding: '0.3rem 0.6rem', borderRadius: 6,
                              border: '2px solid',
                              borderColor: s.status === 'Present' ? '#2e7d32' : s.status === 'Absent' ? '#c62828' : '#e65100',
                              color: s.status === 'Present' ? '#2e7d32' : s.status === 'Absent' ? '#c62828' : '#e65100',
                              fontWeight: 700, background: 'white', cursor: 'pointer'
                            }}
                          >
                            <option value="Present">✔ Present</option>
                            <option value="Absent">✘ Absent</option>
                            <option value="Late">⏱ Late</option>
                          </select>
                        </td>
                        <td>
                          <input
                            value={s.remark}
                            onChange={e => updateField(idx, 'remark', e.target.value)}
                            placeholder="e.g. Medical leave"
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1.5px solid #e0e0e0', width: '100%' }}
                          />
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => removeStudent(idx)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '0.7rem 2rem', fontSize: '1rem' }}>
                  {saving ? 'Saving...' : '💾 Save Attendance'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main Teacher Dashboard ───────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', class: '', dueDate: '' });
  const [file, setFile] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [tab, setTab] = useState('assignments');

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
        <p>Welcome, {user.name}! Manage assignments and student attendance.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{myAssignments.length}</div><div className="label">My Assignments</div></div>
        <div className="stat-card"><div className="num">{[...new Set(myAssignments.map(a => a.class))].length}</div><div className="label">Classes Covered</div></div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>
          📚 My Assignments
        </button>
        <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>
          📋 Mark Attendance
        </button>
      </div>

      {/* ── Assignments Tab ── */}
      {tab === 'assignments' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
        </>
      )}

      {/* ── Attendance Tab ── */}
      {tab === 'attendance' && <AttendanceSection teacherUser={user} />}

      {/* Upload Modal */}
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