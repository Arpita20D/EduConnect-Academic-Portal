import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { fileUrl } from '../../utils/fileUrl';


/* ─────────────────────────────────────────────
   UPLOAD PANEL  (teachers + admins only)
───────────────────────────────────────────── */
const UploadAttendance = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selClass, setSelClass] = useState('');
  const [selMonth, setSelMonth] = useState(currentMonth);
  const [rows,     setRows]     = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(false);

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
          totalDays:   saved ? saved.totalDays   : 26,
          daysPresent: saved ? saved.daysPresent  : '',
          daysAbsent:  saved ? saved.daysAbsent   : '',
          daysLate:    saved ? saved.daysLate     : '',
          remarks:     saved ? saved.remarks      : '',
        };
      }));
    } catch { toast.error('Could not load student data'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(selClass, selMonth); }, [selClass, selMonth, loadData]);

  const update = (i, field, val) =>
    setRows(p => p.map((r, j) => j === i ? { ...r, [field]: val } : r));

  const handleSave = async () => {
    if (!selClass || !selMonth) return toast.error('Select class and month');
    if (rows.length === 0) return toast.error('No students found for this class');
    for (const r of rows) {
      if (r.daysPresent === '' || r.totalDays === '') return toast.error(`Fill Days Present for all students`);
      if (Number(r.daysPresent) > Number(r.totalDays)) return toast.error(`Days Present > Total Days for ${r.studentName}`);
    }
    setSaving(true);
    try {
      await axios.post('/api/attendance/monthly', {
        month: selMonth, class: Number(selClass),
        students: rows.map(r => ({
          studentName: r.studentName,
          totalDays:   Number(r.totalDays),
          daysPresent: Number(r.daysPresent),
          daysAbsent:  r.daysAbsent !== '' ? Number(r.daysAbsent) : Number(r.totalDays) - Number(r.daysPresent),
          daysLate:    Number(r.daysLate || 0),
          remarks:     r.remarks,
        })),
      });
      toast.success(`✅ Attendance saved for Class ${selClass} — ${selMonth}`);
      loadData(selClass, selMonth);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const monthLabel = selMonth
    ? new Date(selMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div>
      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#1a237e', marginBottom: '1rem' }}>📤 Upload Monthly Attendance</h3>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label>📖 Select Class</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)}>
              <option value="">— Choose Class —</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📅 Month</label>
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} />
          </div>
        </div>
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.8rem', marginBottom: 0 }}>
          Enter the number of days for each student for <strong>{monthLabel}</strong>. Percentage is calculated automatically.
        </p>
      </div>

      {!selClass && <div className="empty-state"><div className="icon">📋</div><p>Select a class above to begin.</p></div>}
      {selClass && loading && <div className="loading">Loading students...</div>}
      {selClass && !loading && rows.length === 0 && (
        <div className="empty-state">
          <div className="icon">🧑‍🎓</div>
          <p>No students in Class {selClass}.</p>
          <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Go to Admin Dashboard → Students tab to add students first.</p>
        </div>
      )}

      {selClass && !loading && rows.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: '#555', margin: 0, fontSize: '0.9rem' }}>
              <strong>{rows.length}</strong> students · Class {selClass} · {monthLabel}
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => setRows(p => p.map(r => ({ ...r, totalDays: 26 })))}>
              Set All Total Days = 26
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Student Name</th><th>Total Days *</th>
                  <th>Days Present *</th><th>Days Absent</th><th>Days Late</th>
                  <th>Attendance %</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pct = r.totalDays && r.daysPresent !== ''
                    ? Math.round((Number(r.daysPresent) / Number(r.totalDays)) * 100) : null;
                  const col = pct === null ? '#888' : pct >= 75 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
                  return (
                    <tr key={i}>
                      <td style={{ color: '#888', width: 32 }}>{i+1}</td>
                      <td><strong>{r.studentName}</strong></td>
                      <td><input type="number" min="1" max="31" value={r.totalDays}
                        onChange={e => update(i, 'totalDays', e.target.value)}
                        style={{ width: 64, padding: '0.3rem', borderRadius: 6, border: '2px solid #e0e0e0', textAlign: 'center' }} /></td>
                      <td><input type="number" min="0" max={r.totalDays} value={r.daysPresent}
                        onChange={e => update(i, 'daysPresent', e.target.value)}
                        style={{ width: 64, padding: '0.3rem', borderRadius: 6, border: '2px solid #3949ab', textAlign: 'center' }} /></td>
                      <td><input type="number" min="0" max={r.totalDays} value={r.daysAbsent}
                        onChange={e => update(i, 'daysAbsent', e.target.value)} placeholder="auto"
                        style={{ width: 64, padding: '0.3rem', borderRadius: 6, border: '2px solid #e0e0e0', textAlign: 'center' }} /></td>
                      <td><input type="number" min="0" max={r.totalDays} value={r.daysLate}
                        onChange={e => update(i, 'daysLate', e.target.value)}
                        style={{ width: 64, padding: '0.3rem', borderRadius: 6, border: '2px solid #e0e0e0', textAlign: 'center' }} /></td>
                      <td style={{ fontWeight: 700, color: col, textAlign: 'center' }}>
                        {pct !== null ? `${pct}%` : '—'}
                      </td>
                      <td><input value={r.remarks} onChange={e => update(i, 'remarks', e.target.value)}
                        placeholder="Optional"
                        style={{ width: '100%', minWidth: 100, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1.5px solid #e0e0e0' }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}
              style={{ padding: '0.7rem 2.5rem', fontSize: '1rem' }}>
              {saving ? 'Saving...' : '💾 Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   UPLOAD RESULTS PANEL  (teachers + admins)
───────────────────────────────────────────── */
const UploadResults = () => {
  const [cards,      setCards]      = useState([]);
  const [students,   setStudents]   = useState([]);
  const [filterCls,  setFilterCls]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => { fetchCards(filterCls); }, [filterCls, fetchCards]);

  const loadStudents = async (cls) => {
    if (!cls) { setStudents([]); return; }
    try { const { data } = await axios.get(`/api/students?class=${cls}`); setStudents(data); }
    catch {}
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file)               return toast.error('Please select a PDF file');
    if (!form.studentName)   return toast.error('Please select a student');
    setSubmitting(true);
    const fd = new FormData();
    fd.append('studentName', form.studentName);
    fd.append('class',       form.class);
    fd.append('term',        form.term);
    fd.append('remarks',     form.remarks);
    fd.append('file',        file);
    try {
      await axios.post('/api/reportcards', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('✅ Result uploaded! Visible in Parent Portal.');
      setForm({ studentName: '', class: '', term: '', remarks: '' });
      setFile(null); setStudents([]);
      fetchCards(filterCls);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try { await axios.delete(`/api/reportcards/${id}`); toast.success('Deleted'); fetchCards(filterCls); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #3949ab' }}>
        <h3 style={{ color: '#1a237e', marginBottom: '0.4rem' }}>📤 Upload Student Result / Report Card</h3>
        <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '1rem' }}>
          Upload a PDF result card for an individual student. It will appear in the Parent Portal under their name.
        </p>
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select value={form.class}
                onChange={e => { setForm(f => ({ ...f, class: e.target.value, studentName: '' })); loadStudents(e.target.value); }}
                required>
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
                <input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                  placeholder={!form.class ? 'Select class first' : 'Type student name'}
                  required />
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Exam / Term Name *</label>
              <input value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} required
                placeholder="e.g. Mid-Term 2025, Final Exam 2025" />
            </div>
            <div className="form-group">
              <label>PDF Result File *</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
              <small style={{ color: '#888' }}>PDF only · max 10 MB</small>
            </div>
          </div>
          <div className="form-group">
            <label>Teacher's Remarks (optional)</label>
            <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows="2"
              placeholder="e.g. Excellent performance. Needs improvement in Maths." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Uploading...' : '⬆ Upload Result'}
          </button>
        </form>
      </div>

      {/* Uploaded results list */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#1a237e' }}>📄 Uploaded Results</h3>
        <select value={filterCls} onChange={e => setFilterCls(e.target.value)}
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
            <thead><tr><th>Student</th><th>Class</th><th>Exam / Term</th><th>Remarks</th><th>Uploaded</th><th>PDF</th><th>Delete</th></tr></thead>
            <tbody>
              {cards.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.studentName}</strong></td>
                  <td><span className="badge badge-class">Class {c.class}</span></td>
                  <td>{c.term}</td>
                  <td style={{ color: '#666', maxWidth: 160, fontSize: '0.85rem' }}>{c.remarks || '—'}</td>
                  <td style={{ fontSize: '0.83rem', color: '#888' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <a href={fileUrl(c.filePath)}
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

/* ─────────────────────────────────────────────
   PUBLIC SEARCH PANEL  (everyone — no login)
───────────────────────────────────────────── */
const PublicSearch = () => {
  const [form, setForm]     = useState({ studentName: '', class: '', month: '' });
  const [records, setRecords] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);

  const fetchSuggestions = async (cls) => {
    try { const { data } = await axios.get(`/api/attendance/public/students?class=${cls}`); setSuggestions(data); }
    catch {}
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.class) return toast.error('Enter student name and class');
    setLoading(true); setSearched(false);
    try {
      const params = new URLSearchParams({ studentName: form.studentName.trim(), class: form.class });
      if (form.month) params.append('month', form.month);
      const { data } = await axios.get(`/api/attendance/public?${params}`);
      setRecords(data);
      setSearched(true);
    } catch { toast.error('Search failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#1a237e', marginBottom: '1rem' }}>🔍 Search Student Attendance</h3>
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-group">
              <label>Student's Class *</label>
              <select value={form.class} onChange={e => { setForm(f => ({ ...f, class: e.target.value, studentName: '' })); fetchSuggestions(e.target.value); }} required>
                <option value="">— Select Class —</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Student Name *</label>
              <input value={form.studentName}
                onChange={e => { setForm(f => ({ ...f, studentName: e.target.value })); setShowSug(true); }}
                onFocus={() => setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                placeholder="Enter student's full name" required autoComplete="off" />
              {showSug && form.studentName.length > 0 && suggestions.filter(s => s.toLowerCase().includes(form.studentName.toLowerCase())).length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #3949ab', borderRadius: 8, zIndex: 10, maxHeight: 160, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                  {suggestions.filter(s => s.toLowerCase().includes(form.studentName.toLowerCase())).map(s => (
                    <div key={s} onMouseDown={() => { setForm(f => ({ ...f, studentName: s })); setShowSug(false); }}
                      style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e8eaf6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      🧑‍🎓 {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Filter by Month (optional)</label>
            <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} />
            <small style={{ color: '#888' }}>Leave blank to see all months</small>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search Attendance'}
          </button>
        </form>
      </div>

      {searched && (
        records.length === 0 ? (
          <div className="empty-state" style={{ background: 'white', borderRadius: 10, padding: '2rem' }}>
            <div className="icon">🔍</div>
            <p>No attendance records found for <strong>{form.studentName}</strong> in Class {form.class}.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th><th>Remarks</th></tr></thead>
              <tbody>
                {records.map(r => {
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
        )
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN ATTENDANCE PAGE — role-aware
───────────────────────────────────────────── */
const AttendancePage = () => {
  const { user } = useAuth();
  const isStaff  = user && (user.role === 'teacher' || user.role === 'admin');
  const [tab, setTab] = useState(isStaff ? 'upload' : 'search');

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 65px)', paddingBottom: '3rem' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1a237e,#283593)', color: 'white', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📊 Attendance &amp; Results</h1>
        <p style={{ opacity: 0.85, maxWidth: 560, margin: '0 auto' }}>
          {isStaff
            ? 'Upload monthly attendance and student result cards below.'
            : 'Search a student\'s monthly attendance record or result cards.'}
        </p>
      </div>

      <div className="container" style={{ maxWidth: 960 }}>
        {/* Tabs */}
        <div className="tabs" style={{ marginTop: '1.5rem' }}>
          {isStaff && (
            <>
              <button className={`tab ${tab === 'upload'  ? 'active' : ''}`} onClick={() => setTab('upload')}>📤 Upload Attendance</button>
              <button className={`tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>📄 Upload Results</button>
            </>
          )}
          <button className={`tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>🔍 Search Records</button>
        </div>

        {tab === 'upload'  && <UploadAttendance />}
        {tab === 'results' && <UploadResults />}
        {tab === 'search'  && <PublicSearch />}
      </div>
    </div>
  );
};

export default AttendancePage;