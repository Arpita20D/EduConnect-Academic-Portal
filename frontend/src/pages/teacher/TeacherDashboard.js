import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

/* ══════════════════════════════════════════════════════════════
   MONTHLY ATTENDANCE SECTION
   Teacher picks class + month, enters numbers for each student:
   totalDays, daysPresent, daysAbsent, daysLate
══════════════════════════════════════════════════════════════ */
const AttendanceSection = () => {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [selClass,  setSelClass]  = useState('');
  const [selMonth,  setSelMonth]  = useState(currentMonth);
  const [rows,      setRows]      = useState([]); // { studentName, totalDays, daysPresent, daysAbsent, daysLate, remarks }
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(false);

  // Load master student list, then overlay any saved monthly data
  const loadData = useCallback(async (cls, month) => {
    if (!cls || !month) return;
    setLoading(true);
    try {
      const [studRes, attRes] = await Promise.all([
        axios.get(`/api/students?class=${cls}`),
        axios.get(`/api/attendance/monthly?class=${cls}&month=${month}`),
      ]);
      const savedMap = {};
      attRes.data.forEach(r => { savedMap[r.studentName.toLowerCase()] = r; });

      setRows(studRes.data.map(s => {
        const saved = savedMap[s.name.toLowerCase()];
        return {
          studentName: s.name,
          totalDays:   saved?.totalDays   ?? 26,
          daysPresent: saved?.daysPresent ?? '',
          daysAbsent:  saved?.daysAbsent  ?? '',
          daysLate:    saved?.daysLate    ?? '',
          remarks:     saved?.remarks     || '',
        };
      }));
    } catch {
      toast.error('Could not load student data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(selClass, selMonth); }, [selClass, selMonth, loadData]);

  const updateRow = (i, field, val) =>
    setRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: val } : r));

  const handleSave = async () => {
    if (!selClass || !selMonth) return toast.error('Select class and month');
    if (rows.length === 0) return toast.error('No students to save');
    // Validate
    for (const r of rows) {
      if (r.daysPresent === '' || r.totalDays === '') {
        return toast.error(`Fill in Days Present and Total Days for all students`);
      }
      if (Number(r.daysPresent) > Number(r.totalDays)) {
        return toast.error(`Days Present cannot exceed Total Days for ${r.studentName}`);
      }
    }
    setSaving(true);
    try {
      await axios.post('/api/attendance/monthly', {
        month: selMonth,
        class: Number(selClass),
        students: rows.map(r => ({
          studentName: r.studentName,
          totalDays:   Number(r.totalDays),
          daysPresent: Number(r.daysPresent),
          daysAbsent:  r.daysAbsent !== '' ? Number(r.daysAbsent) : Number(r.totalDays) - Number(r.daysPresent),
          daysLate:    Number(r.daysLate || 0),
          remarks:     r.remarks,
        })),
      });
      toast.success(`Attendance saved for Class ${selClass} — ${selMonth}`);
      loadData(selClass, selMonth);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const monthLabel = selMonth
    ? new Date(selMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div>
      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label>📖 Class</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)}>
              <option value="">— Select Class —</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📅 Month</label>
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} />
          </div>
        </div>
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.8rem', marginBottom: 0 }}>
          Enter the number of days for each student for <strong>{monthLabel}</strong>. The system calculates the attendance percentage automatically.
        </p>
      </div>

      {!selClass && <div className="empty-state"><div className="icon">📋</div><p>Select a class to begin.</p></div>}
      {selClass && loading && <div className="loading">Loading students...</div>}
      {selClass && !loading && rows.length === 0 && (
        <div className="empty-state">
          <div className="icon">🧑‍🎓</div>
          <p>No students in Class {selClass}. Ask admin to add students first.</p>
        </div>
      )}

      {selClass && !loading && rows.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: '#555', margin: 0, fontSize: '0.9rem' }}>
              <strong>{rows.length}</strong> students · Class {selClass} · {monthLabel}
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRows(prev => prev.map(r => ({ ...r, totalDays: 26 })))}
            >
              Set All Total Days = 26
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Total Days *</th>
                  <th>Days Present *</th>
                  <th>Days Absent</th>
                  <th>Days Late</th>
                  <th>Attendance %</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pct = r.totalDays && r.daysPresent !== ''
                    ? Math.round((Number(r.daysPresent) / Number(r.totalDays)) * 100)
                    : null;
                  const pctColor = pct === null ? '#888' : pct >= 75 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
                  return (
                    <tr key={i}>
                      <td style={{ color: '#888', width: 32 }}>{i+1}</td>
                      <td><strong>{r.studentName}</strong></td>
                      <td>
                        <input type="number" min="1" max="31" value={r.totalDays}
                          onChange={e => updateRow(i, 'totalDays', e.target.value)}
                          style={{ width: 70, padding: '0.3rem 0.5rem', borderRadius: 6, border: '2px solid #e0e0e0', textAlign: 'center' }} />
                      </td>
                      <td>
                        <input type="number" min="0" max={r.totalDays} value={r.daysPresent}
                          onChange={e => updateRow(i, 'daysPresent', e.target.value)}
                          style={{ width: 70, padding: '0.3rem 0.5rem', borderRadius: 6, border: '2px solid #3949ab', textAlign: 'center' }} />
                      </td>
                      <td>
                        <input type="number" min="0" max={r.totalDays} value={r.daysAbsent}
                          onChange={e => updateRow(i, 'daysAbsent', e.target.value)}
                          placeholder="auto"
                          style={{ width: 70, padding: '0.3rem 0.5rem', borderRadius: 6, border: '2px solid #e0e0e0', textAlign: 'center' }} />
                      </td>
                      <td>
                        <input type="number" min="0" max={r.totalDays} value={r.daysLate}
                          onChange={e => updateRow(i, 'daysLate', e.target.value)}
                          style={{ width: 70, padding: '0.3rem 0.5rem', borderRadius: 6, border: '2px solid #e0e0e0', textAlign: 'center' }} />
                      </td>
                      <td style={{ fontWeight: 700, color: pctColor }}>
                        {pct !== null ? `${pct}%` : '—'}
                      </td>
                      <td>
                        <input value={r.remarks}
                          onChange={e => updateRow(i, 'remarks', e.target.value)}
                          placeholder="Optional"
                          style={{ width: '100%', minWidth: 100, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1.5px solid #e0e0e0' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '0.7rem 2.5rem', fontSize: '1rem' }}>
              {saving ? 'Saving...' : '💾 Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   RESULTS SECTION
   Teacher uploads a result PDF per student — appears in parent portal
══════════════════════════════════════════════════════════════ */
const ResultsSection = () => {
  const [cards,       setCards]       = useState([]);
  const [students,    setStudents]    = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [form, setForm] = useState({ studentName: '', class: '', term: '', remarks: '' });
  const [file, setFile] = useState(null);

  const fetchCards = useCallback(async (cls) => {
    setLoading(true);
    try {
      const q = cls ? `?class=${cls}` : '';
      const { data } = await axios.get(`/api/reportcards${q}`);
      setCards(data);
    } catch { toast.error('Failed to load results'); }
    setLoading(false);
  }, []);

  const loadStudentsForClass = async (cls) => {
    if (!cls) { setStudents([]); return; }
    try {
      const { data } = await axios.get(`/api/students?class=${cls}`);
      setStudents(data);
    } catch {}
  };

  useEffect(() => { fetchCards(filterClass); }, [filterClass, fetchCards]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a PDF file');
    if (!form.studentName) return toast.error('Please select a student');
    setSubmitting(true);
    const fd = new FormData();
    fd.append('studentName', form.studentName);
    fd.append('class',       form.class);
    fd.append('term',        form.term);
    fd.append('remarks',     form.remarks);
    fd.append('file',        file);
    try {
      await axios.post('/api/reportcards', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Result uploaded! Visible in the Parent Portal.');
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
      {/* Upload form */}
      <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #3949ab' }}>
        <h3 style={{ color: '#1a237e', marginBottom: '0.4rem' }}>📤 Upload Student Result</h3>
        <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '1rem' }}>
          Upload a result/mark sheet PDF for an individual student. It will appear in the Parent Portal under their child's name.
        </p>
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select value={form.class}
                onChange={e => {
                  setForm(f => ({ ...f, class: e.target.value, studentName: '' }));
                  loadStudentsForClass(e.target.value);
                }} required>
                <option value="">Select Class</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Student Name *</label>
              {form.class && students.length > 0 ? (
                <select value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} required>
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              ) : (
                <input
                  value={form.studentName}
                  onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                  placeholder={!form.class ? 'Select class first' : 'No students — ask admin to add'}
                  required
                />
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Exam / Term *</label>
              <input value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} required placeholder="e.g. Mid-Term 2025, Final Exam 2025" />
            </div>
            <div className="form-group">
              <label>Result PDF *</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
              <small style={{ color: '#888' }}>PDF only · max 10 MB</small>
            </div>
          </div>
          <div className="form-group">
            <label>Teacher's Remarks (optional)</label>
            <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows="2" placeholder="e.g. Excellent performance in all subjects." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Uploading...' : '⬆ Upload Result'}
          </button>
        </form>
      </div>

      {/* Uploaded results list */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#1a237e' }}>📄 Uploaded Results</h3>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '2px solid #e0e0e0' }}>
          <option value="">All Classes</option>
          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="empty-state"><div className="icon">📄</div><p>No results uploaded yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Student</th><th>Class</th><th>Exam / Term</th><th>Remarks</th><th>Uploaded</th><th>PDF</th><th>Delete</th></tr>
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

/* ══════════════════════════════════════════════════════════════
   MAIN TEACHER DASHBOARD
══════════════════════════════════════════════════════════════ */
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

  const fetchAssignments = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/assignments/public');
      setAssignments(data.filter(a => a.teacherName === user.name));
    } catch { toast.error('Failed to load assignments'); }
    setLoading(false);
  }, [user.name]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

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
        <p>Welcome, <strong>{user.name}</strong>! Upload assignments, mark attendance and upload student results.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">My Assignments</div></div>
        <div className="stat-card"><div className="num">{[...new Set(assignments.map(a => a.class))].length}</div><div className="label">Classes</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📚 Assignments</button>
        <button className={`tab ${tab === 'attendance'  ? 'active' : ''}`} onClick={() => setTab('attendance')}>📋 Attendance</button>
        <button className={`tab ${tab === 'results'     ? 'active' : ''}`} onClick={() => setTab('results')}>📄 Results</button>
      </div>

      {/* ── Assignments tab ── */}
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
            <div className="empty-state"><div className="icon">📋</div><p>No assignments yet. Click "Upload Assignment" to add one.</p></div>
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
                <span>👨‍🏫 {a.teacherName}</span>
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
                <label>Teacher Name</label>
                <input value={user.name} disabled style={{ background: '#f5f5f5', color: '#555' }} />
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