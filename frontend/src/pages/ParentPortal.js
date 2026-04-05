import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fileUrl } from '../utils/fileUrl';

const ParentPortal = () => {
  const { user } = useAuth();
  const [form, setForm]             = useState({ studentName: '', class: '', month: '' });
  const [attRecords, setAttRecords] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [searched, setSearched]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]       = useState(false);

  const fetchSuggestions = async (cls) => {
    try {
      const { data } = await axios.get(`/api/attendance/public/students?class=${cls}`);
      setSuggestions(data);
    } catch { /* silent */ }
  };

  const handleClassChange = (cls) => {
    setForm(f => ({ ...f, class: cls, studentName: '' }));
    if (cls) fetchSuggestions(cls);
    else setSuggestions([]);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const name = form.studentName.trim();
    if (!name || !form.class) return toast.error('Please enter student name and class');
    setLoading(true); setSearched(false);
    try {
      const attParams = new URLSearchParams({ studentName: name, class: form.class });
      if (form.month) attParams.append('month', form.month);
      const [attRes, rcRes] = await Promise.all([
        axios.get(`/api/attendance/public?${attParams}`),
        axios.get(`/api/reportcards/public?studentName=${encodeURIComponent(name)}&class=${form.class}`),
      ]);
      setAttRecords(attRes.data);
      setReportCards(rcRes.data);
      setSearched(true);
    } catch { toast.error('Search failed. Please try again.'); }
    setLoading(false);
  };

  // Redirect logged-in parents to their dashboard
  if (user && user.role === 'parent') {
    return (
      <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 450, textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍👩‍👧</div>
          <h2 style={{ color: '#1a237e', marginBottom: '0.5rem' }}>You have a Parent Account!</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Your personalised dashboard shows {user.childName}'s attendance, results, assignments and notices.
          </p>
          <Link to="/parent" className="btn btn-primary">Go to My Dashboard →</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 65px)', paddingBottom: '3rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1a237e,#283593)', color: 'white', padding: '2.5rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍👩‍👧 Parent Portal</h1>
        <p style={{ opacity: 0.85, maxWidth: 560, margin: '0 auto 1rem' }}>
          Search your child's monthly attendance and download their result cards — no login required.
        </p>
        {!user && (
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
            Have a parent account? <Link to="/login" style={{ color: '#90caf9', fontWeight: 600 }}>Login</Link> for a personalised dashboard.
          </p>
        )}
      </div>

      <div className="container" style={{ maxWidth: 780 }}>
        {/* Search form */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#1a237e', marginBottom: '1.2rem' }}>🔍 Search Your Child's Records</h3>
          <form onSubmit={handleSearch}>
            <div className="form-row">
              <div className="form-group">
                <label>Child's Class *</label>
                <select value={form.class} onChange={e => handleClassChange(e.target.value)} required>
                  <option value="">— Select Class —</option>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Child's Name *</label>
                <input
                  value={form.studentName}
                  onChange={e => { setForm(f => ({ ...f, studentName: e.target.value })); setShowSug(true); }}
                  onFocus={() => setShowSug(true)}
                  onBlur={() => setTimeout(() => setShowSug(false), 150)}
                  placeholder="Enter your child's full name" required autoComplete="off"
                />
                {showSug && form.class && form.studentName.length > 0 && suggestions.filter(s => s.toLowerCase().includes(form.studentName.toLowerCase())).length > 0 && (
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
              {loading ? 'Searching...' : '🔍 Search Records'}
            </button>
          </form>
        </div>

        {searched && (
          <>
            {/* ── Monthly Attendance ── */}
            <h2 className="section-title" style={{ marginTop: '2rem' }}>
              📊 Attendance — {form.studentName} (Class {form.class})
            </h2>
            {attRecords.length === 0 ? (
              <div className="empty-state" style={{ background: 'white', borderRadius: 10, padding: '2rem' }}>
                <div className="icon">📋</div>
                <p>No attendance records found. The teacher may not have uploaded attendance yet.</p>
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
                      const pctColor = pct >= 75 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
                      const monthLabel = new Date(r.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                      return (
                        <tr key={r._id}>
                          <td><strong>{monthLabel}</strong></td>
                          <td style={{ textAlign: 'center' }}>{r.totalDays}</td>
                          <td style={{ textAlign: 'center', color: '#2e7d32', fontWeight: 600 }}>{r.daysPresent}</td>
                          <td style={{ textAlign: 'center', color: '#c62828', fontWeight: 600 }}>{r.daysAbsent}</td>
                          <td style={{ textAlign: 'center', color: '#e65100', fontWeight: 600 }}>{r.daysLate || 0}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: pctColor }}>
                            {pct}%
                            <div style={{ height: 6, background: '#eee', borderRadius: 10, marginTop: 4, width: 60, display: 'inline-block', marginLeft: 8, verticalAlign: 'middle' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 10 }} />
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

            {/* ── Results / Report Cards ── */}
            <h2 className="section-title" style={{ marginTop: '2rem' }}>📄 Results / Report Cards</h2>
            {reportCards.length === 0 ? (
              <div className="empty-state" style={{ background: 'white', borderRadius: 10, padding: '2rem' }}>
                <div className="icon">📄</div>
                <p>No results uploaded yet for {form.studentName}.</p>
              </div>
            ) : reportCards.map(c => (
              <div key={c._id} className="card">
                <div className="card-header">
                  <div>
                    <h3>📄 {c.term}</h3>
                    <span className="badge badge-class">Class {c.class}</span>
                  </div>
                  <a href={fileUrl(c.filePath)}
                     target="_blank" rel="noreferrer" className="btn btn-success btn-sm">⬇ Download PDF</a>
                </div>
                {c.remarks && <p style={{ color: '#555', marginTop: '0.5rem' }}>📝 {c.remarks}</p>}
                <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                  Uploaded by {c.teacherName} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;