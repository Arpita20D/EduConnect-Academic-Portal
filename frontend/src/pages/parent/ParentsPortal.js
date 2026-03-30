import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ParentPortal = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ studentName: '', class: '', month: '' });
  const [attRecords, setAttRecords] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);

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
    setLoading(true);
    setSearched(false);
    try {
      const attParams = new URLSearchParams({ studentName: name, class: form.class });
      if (form.month) attParams.append('month', form.month);
      const rcParams = new URLSearchParams({ studentName: name, class: form.class });

      const [attRes, rcRes] = await Promise.all([
        axios.get(`/api/attendance/public?${attParams}`),
        axios.get(`/api/reportcards/public?${rcParams}`),
      ]);
      setAttRecords(attRes.data);
      setReportCards(rcRes.data);
      setSearched(true);
    } catch (err) {
      toast.error('Search failed. Please try again.');
    }
    setLoading(false);
  };

  const total   = attRecords.length;
  const present = attRecords.filter(r => r.status === 'Present').length;
  const absent  = attRecords.filter(r => r.status === 'Absent').length;
  const late    = attRecords.filter(r => r.status === 'Late').length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  const statusColor = { Present: '#2e7d32', Absent: '#c62828', Late: '#e65100' };
  const statusBg    = { Present: '#e8f5e9', Absent: '#ffebee', Late: '#fff3e0' };

  // If logged in as parent, nudge them to their dashboard
  if (user && user.role === 'parent') {
    return (
      <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 450, textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍👩‍👧</div>
          <h2 style={{ color: '#1a237e', marginBottom: '0.5rem' }}>You have a Parent Account!</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Your personalised dashboard shows {user.childName}'s attendance, report cards, assignments and notices.
          </p>
          <Link to="/parent" className="btn btn-primary">Go to My Dashboard →</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 65px)', paddingBottom: '3rem' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1a237e,#283593)', color: 'white', padding: '2.5rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍👩‍👧 Parent Portal</h1>
        <p style={{ opacity: 0.85, maxWidth: 560, margin: '0 auto 1.2rem' }}>
          Search your child's attendance record and download their report cards — no login required.
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
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Class {i+1}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Child's Name *</label>
                <input
                  value={form.studentName}
                  onChange={e => { setForm(f => ({ ...f, studentName: e.target.value })); setShowSug(true); }}
                  onFocus={() => setShowSug(true)}
                  onBlur={() => setTimeout(() => setShowSug(false), 150)}
                  placeholder="Enter your child's full name"
                  required
                  autoComplete="off"
                />
                {showSug && form.class && form.studentName.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white',
                    border: '2px solid #3949ab', borderRadius: 8, zIndex: 10, maxHeight: 180, overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                    {suggestions
                      .filter(s => s.toLowerCase().includes(form.studentName.toLowerCase()))
                      .map(s => (
                        <div key={s}
                          onMouseDown={() => { setForm(f => ({ ...f, studentName: s })); setShowSug(false); }}
                          style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '0.95rem' }}
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
              <label>Filter Attendance by Month (optional)</label>
              <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} />
              <small style={{ color: '#888' }}>Leave blank to see all attendance records</small>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
              {loading ? 'Searching...' : '🔍 Search Records'}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <>
            {/* ── Attendance ── */}
            <h2 className="section-title" style={{ marginTop: '2rem' }}>📊 Attendance — {form.studentName} (Class {form.class})</h2>

            {attRecords.length === 0 ? (
              <div className="empty-state" style={{ background: 'white', borderRadius: 10, padding: '2rem' }}>
                <div className="icon">📋</div>
                <p>No attendance records found. Check the name matches exactly what the teacher entered.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="card" style={{ background: 'linear-gradient(135deg,#1a237e,#3949ab)', color: 'white', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                    {[['Total', total, 'rgba(255,255,255,0.15)'],
                      ['Present', present, 'rgba(46,125,50,0.4)'],
                      ['Absent', absent, 'rgba(198,40,40,0.4)'],
                      ['Late', late, 'rgba(230,81,0,0.4)'],
                      [`${pct}%`, '', 'rgba(255,255,255,0.15)']
                    ].map(([label, val, bg], i) => (
                      <div key={i} style={{ textAlign: 'center', background: bg, borderRadius: 10, padding: '0.8rem' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{i === 4 ? pct + '%' : val}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{i === 4 ? 'Attendance %' : label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 20, transition: 'width 0.4s',
                      background: pct >= 75 ? '#66bb6a' : pct >= 50 ? '#ffa726' : '#ef5350' }} />
                  </div>
                  <p style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.4rem' }}>
                    {pct >= 75 ? '✅ Good attendance' : pct >= 50 ? '⚠️ Needs improvement' : '❌ Critically low attendance'}
                  </p>
                </div>

                {/* Day-by-day table */}
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Remark</th><th>Teacher</th></tr></thead>
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
                          <td style={{ color: '#888', fontSize: '0.85rem' }}>{r.teacherName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Report Cards ── */}
            <h2 className="section-title" style={{ marginTop: '2rem' }}>📄 Report Cards</h2>
            {reportCards.length === 0 ? (
              <div className="empty-state" style={{ background: 'white', borderRadius: 10, padding: '2rem' }}>
                <div className="icon">📄</div>
                <p>No report cards uploaded yet for {form.studentName}.</p>
              </div>
            ) : (
              reportCards.map(c => (
                <div key={c._id} className="card">
                  <div className="card-header">
                    <div>
                      <h3>📄 {c.term}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                        <span className="badge badge-class">Class {c.class}</span>
                      </div>
                    </div>
                    <a
                      href={`/uploads/${c.filePath.replace(/\\/g, '/').split('uploads/')[1]}`}
                      target="_blank" rel="noreferrer"
                      className="btn btn-success btn-sm">
                      ⬇ Download PDF
                    </a>
                  </div>
                  {c.remarks && <p style={{ color: '#555', marginTop: '0.5rem' }}>📝 {c.remarks}</p>}
                  <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                    Uploaded by {c.teacherName} · {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;