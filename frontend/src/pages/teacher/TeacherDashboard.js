import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

/* ═══════════════════════════════════════════════════════════
   ATTENDANCE SECTION
   - Pulls student list from /api/students (master list)
   - Teacher marks present/absent/late per date
═══════════════════════════════════════════════════════════ */
const AttendanceSection = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selClass, setSelClass] = useState('');
  const [selDate,  setSelDate]  = useState(today);
  const [rows,     setRows]     = useState([]); // { studentName, status, remark }
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Load master student list for selected class
  const loadStudents = useCallback(async (cls) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/students?class=${cls}`);
      // Check if attendance already saved for this date
      const { data: existing } = await axios.get(`/api/attendance/class?class=${cls}&date=${today}`);
      const existingMap = {};
      existing.forEach(r => { existingMap[r.studentName.toLowerCase()] = r; });

      setRows(data.map(s => ({
        studentName: s.name,
        status: existingMap[s.name.toLowerCase()]?.status || 'Present',
        remark: existingMap[s.name.toLowerCase()]?.remark || '',
      })));
    } catch { toast.error('Could not load students'); }
    setLoading(false);
  }, [today]);

  // When class changes: reload students
  useEffect(() => {
    if (!selClass) { setRows([]); return; }
    loadStudents(selClass);
  }, [selClass, loadStudents]);

  // When date changes: reload saved attendance for that date (keep student list)
  useEffect(() => {
    if (!selClass || rows.length === 0) return;
    axios.get(`/api/attendance/class?class=${selClass}&date=${selDate}`)
      .then(({ data }) => {
        if (data.length > 0) {
          const map = {};
          data.forEach(r => { map[r.studentName.toLowerCase()] = r; });
          setRows(prev => prev.map(r => ({
            ...r,
            status: map[r.studentName.toLowerCase()]?.status || 'Present',
            remark: map[r.studentName.toLowerCase()]?.remark  || '',
          })));
        } else {
          setRows(prev => prev.map(r => ({ ...r, status: 'Present', remark: '' })));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line
  }, [selDate]);

  const markAll = (status) => setRows(p => p.map(r => ({ ...r, status })));

  const handleSave = async () => {
    if (!selClass) return toast.error('Select a class first');
    if (rows.length === 0) return toast.error('No students to save');
    setSaving(true);
    try {
      await axios.post('/api/attendance/bulk', {
        date: selDate, class: Number(selClass), students: rows,
      });
      toast.success(`Attendance saved for Class ${selClass} — ${selDate}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const present = rows.filter(r => r.status === 'Present').length;
  const absent  = rows.filter(r => r.status === 'Absent').length;
  const late    = rows.filter(r => r.status === 'Late').length;

  return (
    <div>
      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label>📖 Select Class</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)}>
              <option value="">— Choose Class —</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📅 Date</label>
            <input type="date" value={selDate} max={today} onChange={e => setSelDate(e.target.value)} />
          </div>
        </div>
        {selClass && (
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.8rem', marginBottom: 0 }}>
            ℹ️ Student list is taken from the master list added by the admin. Contact admin to add/remove students.
          </p>
        )}
      </div>

      {!selClass && <div className="empty-state"><div className="icon">📋</div><p>Select a class to begin marking attendance.</p></div>}

      {selClass && loading && <div className="loading">Loading students...</div>}

      {selClass && !loading && rows.length === 0 && (
        <div className="empty-state">
          <div className="icon">🧑‍🎓</div>
          <p>No students found for Class {selClass}.</p>
          <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Ask admin to add students first.</p>
        </div>
      )}

      {selClass && !loading && rows.length > 0 && (
        <>
          {/* Summary + bulk buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem' }}>
              <strong style={{ color: '#2e7d32' }}>✔ {present} Present</strong>&nbsp;&nbsp;
              <strong style={{ color: '#c62828' }}>✘ {absent} Absent</strong>&nbsp;&nbsp;
              <strong style={{ color: '#e65100' }}>⏱ {late} Late</strong>
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-success btn-sm" onClick={() => markAll('Present')}>All Present</button>
              <button className="btn btn-danger btn-sm"  onClick={() => markAll('Absent')}>All Absent</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Student Name</th><th>Status</th><th>Remark (optional)</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: '#888', width: 36 }}>{i + 1}</td>
                    <td><strong>{r.studentName}</strong></td>
                    <td>
                      <select
                        value={r.status}
                        onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}
                        style={{
                          padding: '0.3rem 0.5rem', borderRadius: 6, border: '2px solid', fontWeight: 700, background: 'white', cursor: 'pointer',
                          borderColor: r.status === 'Present' ? '#2e7d32' : r.status === 'Absent' ? '#c62828' : '#e65100',
                          color:       r.status === 'Present' ? '#2e7d32' : r.status === 'Absent' ? '#c62828' : '#e65100',
                        }}
                      >
                        <option value="Present">✔ Present</option>
                        <option value="Absent">✘ Absent</option>
                        <option value="Late">⏱ Late</option>
                      </select>
                    </td>
                    <td>
                      <input
                        value={r.remark}
                        onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, remark: e.target.value } : x))}
                        placeholder="e.g. Medical leave"
                        style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1.5px solid #e0e0e0', width: '100%' }}
                      />
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
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   RESULTS SECTION
   - Teacher uploads a result PDF per student
   - Same flow as assignments but for individual students
   - Appears in parent portal under "Report Cards"
═══════════════════════════════════════════════════════════ */
const ResultsSection = () => {
  const [cards,       setCards]       = useState([]);
  const [students,    setStudents]    = useState([]); // master list for selected class
  const [filterClass, setFilterClass] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [form, setForm] = useState({ studentName: '', class: '', term: '', remarks: '' });
  const [file, setFile] = useState(null);

  const fetchCards = async (cls) => {
    setLoading(true);
    try {
      const q = cls ? `?class=${cls}` : '';
      const { data } = await axios.get(`/api/reportcards${q}`);
      setCards(data);
    } catch { toast.error('Failed to load results'); }
    setLoading(false);
  };

  // When class picker in FORM changes, load student names
  const loadStudentsForClass = async (cls) => {
    if (!cls) { setStudents([]); return; }
    try {
      const { data } = await axios.get(`/api/students?class=${cls}`);
      setStudents(data);
    } catch {}
  };

  useEffect(() => { fetchCards(filterClass); }, [filterClass]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a PDF file');
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    try {
      await axios.post('/api/reportcards', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Result uploaded! Parents can now view it in the portal.');
      setForm({ studentName: '', class: '', term: '', remarks: '' });
      setFile(null);
      setStudents([]);
      fetchCards(filterClass);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try { await axios.delete(`/api/reportcards/${id}`); toast.success('Deleted'); fetchCards(filterClass); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      {/* Upload Form */}
      <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #3949ab' }}>
        <h3 style={{ color: '#1a237e', marginBottom: '0.5rem' }}>📤 Upload Student Result</h3>
        <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '1rem' }}>
          Upload a result/mark sheet PDF for an individual student. It will appear in the Parent Portal under their child's name.
        </p>
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select value={form.class}
                onChange={e => {
                  const cls = e.target.value;
                  setForm(f => ({ ...f, class: cls, studentName: '' }));
                  loadStudentsForClass(cls);
                }} required>
                <option value="">Select Class</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Student Name *</label>
              {students.length > 0 ? (
                <select value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} required>
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              ) : (
                <input
                  value={form.studentName}
                  onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                  placeholder={form.class ? 'No students found for this class' : 'Select class first'}
                  disabled={!!form.class && students.length === 0}
                  required
                />
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Exam / Term Name *</label>
              <input value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} required placeholder="e.g. Mid-Term 2025, Final Exam" />
            </div>
            <div className="form-group">
              <label>PDF Result File *</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
              <small style={{ color: '#888' }}>PDF only · max 10 MB</small>
            </div>
          </div>
          <div className="form-group">
            <label>Teacher's Remarks (optional)</label>
            <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows="2" placeholder="e.g. Excellent performance, needs improvement in Maths..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Uploading...' : '⬆ Upload Result'}
          </button>
        </form>
      </div>

      {/* Uploaded Results */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#1a237e' }}>📄 Uploaded Results</h3>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '2px solid #e0e0e0' }}>
          <option value="">All Classes</option>
          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Loading...</div> : cards.length === 0 ? (
        <div className="empty-state"><div className="icon">📄</div><p>No results uploaded yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Student</th><th>Class</th><th>Exam/Term</th><th>Remarks</th><th>Date</th><th>PDF</th><th>Delete</th></tr>
            </thead>
            <tbody>
              {cards.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.studentName}</strong></td>
                  <td><span className="badge badge-class">Class {c.class}</span></td>
                  <td>{c.term}</td>
                  <td style={{ color: '#666', maxWidth: 160, fontSize: '0.85rem' }}>{c.remarks || '—'}</td>
                  <td style={{ fontSize: '0.83rem', color: '#888' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <a href={`/uploads/${c.filePath.replace(/\\/g, '/').split('uploads/')[1]}`}
                       target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⬇ PDF</a>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN TEACHER DASHBOARD
═══════════════════════════════════════════════════════════ */
const TeacherDashboard = () => {
  const { user } = useAuth();
  const [tab,         setTab]        = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [submitting,  setSubmitting] = useState(false);
  const [showModal,   setShowModal]  = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [form, setForm] = useState({ title: '', description: '', subject: '', class: '', dueDate: '' });
  const [file, setFile] = useState(null);

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get('/api/assignments/public');
      setAssignments(data.filter(a => a.teacherName === user.name));
    } catch { toast.error('Failed to load assignments'); }
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please attach a PDF file');
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    try {
      await axios.post('/api/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    try { await axios.delete(`/api/assignments/${id}`); toast.success('Deleted'); fetchAssignments(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = filterClass ? assignments.filter(a => a.class === Number(filterClass)) : assignments;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👨‍🏫 Teacher Dashboard</h1>
        <p>Welcome, {user.name}! Manage assignments, attendance and student results.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">My Assignments</div></div>
        <div className="stat-card"><div className="num">{[...new Set(assignments.map(a => a.class))].length}</div><div className="label">Classes</div></div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📚 Assignments</button>
        <button className={`tab ${tab === 'attendance'  ? 'active' : ''}`} onClick={() => setTab('attendance')}>📋 Attendance</button>
        <button className={`tab ${tab === 'results'     ? 'active' : ''}`} onClick={() => setTab('results')}>📄 Results</button>
      </div>

      {/* ── Assignments ── */}
      {tab === 'assignments' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '2px solid #e0e0e0' }}>
              <option value="">All Classes</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
              + Upload Assignment
            </button>
          </div>

          {loading ? <div className="loading">Loading...</div> : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No assignments yet. Upload one!</p></div>
          ) : filtered.map(a => (
            <div key={a._id} className="card">
              <div className="card-header">
                <div>
                  <h3>{a.title}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-class">Class {a.class}</span>
                    <span className="badge badge-subject">{a.subject}</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}>Delete</button>
              </div>
              {a.description && <p style={{ marginTop: '0.5rem', color: '#555' }}>{a.description}</p>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.85rem', color: '#888' }}>
                {a.dueDate && <span>📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}</span>}
                {a.filePath && (
                  <a href={`/uploads/${a.filePath.replace(/\\/g, '/').split('uploads/')[1]}`}
                     target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⬇ {a.fileName}</a>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'attendance' && <AttendanceSection />}
      {tab === 'results'    && <ResultsSection />}

      {/* Upload Assignment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Upload Assignment</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Assignment title" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject *</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="e.g. Mathematics" />
                </div>
                <div className="form-group">
                  <label>Class *</label>
                  <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} required>
                    <option value="">Select Class</option>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2" placeholder="Brief instructions..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date (optional)</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>PDF File *</label>
                  <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
                  <small style={{ color: '#888' }}>PDF only · max 10 MB</small>
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