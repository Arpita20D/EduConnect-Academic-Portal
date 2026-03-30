import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

// ─── Attendance Sub-Section ───────────────────────────────────────────────────
const AttendanceSection = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selClass, setSelClass] = useState('');
  const [selDate, setSelDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [knownNames, setKnownNames] = useState([]);

  useEffect(() => {
    if (!selClass) return;
    axios.get(`/api/attendance/students?class=${selClass}`)
      .then(r => setKnownNames(r.data))
      .catch(() => {});
  }, [selClass]);

  useEffect(() => {
    if (!selClass) return;
    setLoadingAtt(true);
    axios.get(`/api/attendance/class?class=${selClass}&date=${selDate}`)
      .then(r => {
        if (r.data.length > 0) {
          setStudents(r.data.map(rec => ({ studentName: rec.studentName, status: rec.status, remark: rec.remark || '' })));
        } else {
          setStudents(prev => prev.map(s => ({ ...s, status: 'Present', remark: '' })));
        }
      })
      .catch(() => toast.error('Could not load attendance'))
      .finally(() => setLoadingAtt(false));
  }, [selDate, selClass]);

  const addStudent = () => {
    const name = newName.trim();
    if (!name) return;
    if (students.find(s => s.studentName.toLowerCase() === name.toLowerCase())) {
      toast.error('Already in list'); return;
    }
    setStudents(p => [...p, { studentName: name, status: 'Present', remark: '' }]);
    setNewName('');
  };

  const markAll = (status) => setStudents(p => p.map(s => ({ ...s, status })));

  const handleSave = async () => {
    if (!selClass) return toast.error('Select a class');
    if (students.length === 0) return toast.error('Add at least one student');
    setSaving(true);
    try {
      await axios.post('/api/attendance/bulk', { date: selDate, class: Number(selClass), students });
      toast.success('Attendance saved!');
      axios.get(`/api/attendance/students?class=${selClass}`).then(r => setKnownNames(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const present = students.filter(s => s.status === 'Present').length;
  const absent = students.filter(s => s.status === 'Absent').length;
  const late = students.filter(s => s.status === 'Late').length;
  const suggestions = knownNames.filter(n => !students.find(s => s.studentName.toLowerCase() === n.toLowerCase()));

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label>📖 Class</label>
            <select value={selClass} onChange={e => { setSelClass(e.target.value); setStudents([]); }}>
              <option value="">— Select Class —</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📅 Date</label>
            <input type="date" value={selDate} max={today} onChange={e => setSelDate(e.target.value)} />
          </div>
        </div>
      </div>

      {!selClass && <div className="empty-state"><div className="icon">📋</div><p>Select a class to begin.</p></div>}

      {selClass && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="section-title" style={{ marginTop: 0 }}>Add Students</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStudent(); } }}
                placeholder="Type student name, press Enter or Add"
                style={{ flex: 1, padding: '0.6rem 1rem', border: '2px solid #e0e0e0', borderRadius: 8, fontSize: '1rem' }}
              />
              <button className="btn btn-primary" onClick={addStudent}>+ Add</button>
            </div>
            {suggestions.length > 0 && (
              <div style={{ marginTop: '0.8rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.4rem' }}>Previously added (click to add back):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {suggestions.map(n => (
                    <button key={n} onClick={() => setStudents(p => [...p, { studentName: n, status: 'Present', remark: '' }])}
                      style={{ padding: '0.2rem 0.7rem', borderRadius: 20, border: '1.5px solid #3949ab', background: 'white', color: '#3949ab', cursor: 'pointer', fontSize: '0.83rem' }}>
                      + {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loadingAtt ? <div className="loading">Loading...</div> : students.length === 0 ? (
            <div className="empty-state"><div className="icon">🧑‍🎓</div><p>No students added yet.</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem' }}>
                  <strong style={{ color: '#2e7d32' }}>✔ {present} Present</strong>&nbsp;
                  <strong style={{ color: '#c62828' }}>✘ {absent} Absent</strong>&nbsp;
                  <strong style={{ color: '#e65100' }}>⏱ {late} Late</strong>
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-success btn-sm" onClick={() => markAll('Present')}>All Present</button>
                  <button className="btn btn-danger btn-sm" onClick={() => markAll('Absent')}>All Absent</button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Student</th><th>Status</th><th>Remark</th><th>✕</th></tr></thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i}>
                        <td style={{ color: '#888', width: 36 }}>{i+1}</td>
                        <td><strong>{s.studentName}</strong></td>
                        <td>
                          <select value={s.status}
                            onChange={e => setStudents(p => p.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '2px solid',
                              borderColor: s.status === 'Present' ? '#2e7d32' : s.status === 'Absent' ? '#c62828' : '#e65100',
                              color: s.status === 'Present' ? '#2e7d32' : s.status === 'Absent' ? '#c62828' : '#e65100',
                              fontWeight: 700, background: 'white' }}>
                            <option value="Present">✔ Present</option>
                            <option value="Absent">✘ Absent</option>
                            <option value="Late">⏱ Late</option>
                          </select>
                        </td>
                        <td>
                          <input value={s.remark}
                            onChange={e => setStudents(p => p.map((x, j) => j === i ? { ...x, remark: e.target.value } : x))}
                            placeholder="Optional remark"
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1.5px solid #e0e0e0', width: '100%' }} />
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => setStudents(p => p.filter((_, j) => j !== i))}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '0.7rem 2rem' }}>
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

// ─── Report Card Sub-Section ──────────────────────────────────────────────────
const ReportCardSection = () => {
  const [form, setForm] = useState({ studentName: '', class: '', term: '', remarks: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cards, setCards] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCards = async (cls) => {
    setLoading(true);
    try {
      const q = cls ? `?class=${cls}` : '';
      const { data } = await axios.get(`/api/reportcards${q}`);
      setCards(data);
    } catch { toast.error('Failed to load report cards'); }
    setLoading(false);
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
      toast.success('Report card uploaded!');
      setForm({ studentName: '', class: '', term: '', remarks: '' });
      setFile(null);
      fetchCards(filterClass);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report card?')) return;
    try {
      await axios.delete(`/api/reportcards/${id}`);
      toast.success('Deleted');
      fetchCards(filterClass);
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      {/* Upload Form */}
      <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #3949ab' }}>
        <h3 style={{ color: '#1a237e', marginBottom: '1rem' }}>📤 Upload Report Card</h3>
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-group">
              <label>Student Name *</label>
              <input value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} required placeholder="Exact student name" />
            </div>
            <div className="form-group">
              <label>Class *</label>
              <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} required>
                <option value="">Select Class</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Term / Exam Name *</label>
              <input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} required placeholder="e.g. Term 1 2025, Final Exam" />
            </div>
            <div className="form-group">
              <label>PDF File *</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
              <small style={{ color: '#888' }}>Only PDF, max 10MB</small>
            </div>
          </div>
          <div className="form-group">
            <label>Remarks (optional)</label>
            <textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} rows="2" placeholder="Teacher's remarks..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Uploading...' : '⬆ Upload Report Card'}
          </button>
        </form>
      </div>

      {/* Uploaded Cards */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#1a237e' }}>Uploaded Report Cards</h3>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '2px solid #e0e0e0' }}>
          <option value="">All Classes</option>
          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
        </select>
      </div>

      {loading ? <div className="loading">Loading...</div> : cards.length === 0 ? (
        <div className="empty-state"><div className="icon">📄</div><p>No report cards uploaded yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Class</th><th>Term</th><th>Remarks</th><th>Uploaded</th><th>PDF</th><th>Delete</th></tr></thead>
            <tbody>
              {cards.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.studentName}</strong></td>
                  <td><span className="badge badge-class">Class {c.class}</span></td>
                  <td>{c.term}</td>
                  <td style={{ color: '#666', maxWidth: 150 }}>{c.remarks || '—'}</td>
                  <td style={{ fontSize: '0.83rem', color: '#888' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <a href={`/uploads/${c.filePath.replace(/\\/g, '/').split('uploads/')[1]}`}
                      target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⬇ PDF</a>
                  </td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      const { data } = await axios.get('/api/assignments/public');
      setAssignments(data.filter(a => a.teacherName === user.name));
    } catch { toast.error('Failed to load assignments'); }
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please attach a PDF file');
    setSubmitting(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);
    try {
      await axios.post('/api/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
      toast.success('Deleted');
      fetchAssignments();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = filterClass ? assignments.filter(a => a.class === Number(filterClass)) : assignments;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👨‍🏫 Teacher Dashboard</h1>
        <p>Welcome, {user.name}!</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">My Assignments</div></div>
        <div className="stat-card"><div className="num">{[...new Set(assignments.map(a => a.class))].length}</div><div className="label">Classes</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📚 Assignments</button>
        <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>📋 Attendance</button>
        <button className={`tab ${tab === 'reportcards' ? 'active' : ''}`} onClick={() => setTab('reportcards')}>📄 Report Cards</button>
      </div>

      {/* Assignments */}
      {tab === 'assignments' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '2px solid #e0e0e0' }}>
              <option value="">All Classes</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>+ Upload Assignment</button>
          </div>

          {loading ? <div className="loading">Loading...</div> : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No assignments yet.</p></div>
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
      {tab === 'reportcards' && <ReportCardSection />}

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
                  <small style={{ color: '#888' }}>PDF only, max 10MB</small>
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