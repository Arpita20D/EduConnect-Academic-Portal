import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AttendancePage = () => {
  const [form, setForm] = useState({ studentName: '', class: '', month: '' });
  const [records, setRecords] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Autocomplete: fetch known student names for the selected class
  const fetchSuggestions = async (cls) => {
    if (!cls) return;
    try {
      const { data } = await axios.get(`/api/attendance/public/students?class=${cls}`);
      setSuggestions(data);
    } catch { /* silent */ }
  };

  const handleClassChange = (cls) => {
    setForm(f => ({ ...f, class: cls, studentName: '' }));
    setSuggestions([]);
    if (cls) fetchSuggestions(cls);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.class) {
      return toast.error('Please enter student name and class');
    }
    setLoading(true);
    setSearched(false);
    try {
      const params = new URLSearchParams({
        studentName: form.studentName.trim(),
        class: form.class,
        ...(form.month && { month: form.month }),
      });
      const { data } = await axios.get(`/api/attendance/public?${params}`);
      setRecords(data);
      setSearched(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    }
    setLoading(false);
  };

  // Summary stats
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const late = records.filter(r => r.status === 'Late').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const statusColor = { Present: '#2e7d32', Absent: '#c62828', Late: '#e65100' };
  const statusBg = { Present: '#e8f5e9', Absent: '#ffebee', Late: '#fff3e0' };

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 65px)', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a237e, #283593)', color: 'white', padding: '2.5rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊 Student Attendance</h1>
        <p style={{ opacity: 0.85, maxWidth: 500, margin: '0 auto' }}>
          Parents can search their child's attendance record by name and class.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 750 }}>
        {/* Search Form */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#1a237e', marginBottom: '1rem' }}>🔍 Search Attendance</h3>
          <form onSubmit={handleSearch}>
            <div className="form-row">
              <div className="form-group">
                <label>Child's Class *</label>
                <select value={form.class} onChange={e => handleClassChange(e.target.value)} required>
                  <option value="">— Select Class —</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Child's Name *</label>
                <input
                  value={form.studentName}
                  onChange={e => { setForm(f => ({ ...f, studentName: e.target.value })); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Enter your child's name"
                  required
                  autoComplete="off"
                />
                {/* Autocomplete dropdown */}
                {showSuggestions && form.class && suggestions.filter(s =>
                  s.toLowerCase().includes(form.studentName.toLowerCase()) && form.studentName.length > 0
                ).length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, background: 'white',
                    border: '2px solid #3949ab', borderRadius: 8, zIndex: 10, maxHeight: 180, overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {suggestions
                      .filter(s => s.toLowerCase().includes(form.studentName.toLowerCase()))
                      .map(s => (
                        <div
                          key={s}
                          onMouseDown={() => { setForm(f => ({ ...f, studentName: s })); setShowSuggestions(false); }}
                          style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                          onMouseEnter={e => e.target.style.background = '#e8eaf6'}
                          onMouseLeave={e => e.target.style.background = 'white'}
                        >
                          🧑‍🎓 {s}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Filter by Month (optional)</label>
              <input
                type="month"
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
              />
              <small style={{ color: '#888' }}>Leave blank to see all records</small>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
              {loading ? 'Searching...' : '🔍 Search Attendance'}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <>
            {records.length === 0 ? (
              <div className="empty-state" style={{ marginTop: '2rem' }}>
                <div className="icon">🔍</div>
                <p>No attendance records found for <strong>{form.studentName}</strong> in Class {form.class}.</p>
                <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>
                  Make sure the name and class match exactly what the teacher entered.
                </p>
              </div>
            ) : (
              <>
                {/* Summary Card */}
                <div className="card" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #1a237e, #3949ab)', color: 'white' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'white' }}>
                    📊 Summary — {form.studentName} (Class {form.class})
                    {form.month && ` · ${new Date(form.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{total}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Total Days</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(46,125,50,0.35)', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{present}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Present</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(198,40,40,0.35)', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{absent}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Absent</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(230,81,0,0.35)', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{late}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Late</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{pct}%</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>Attendance %</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: '1.2rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: pct >= 75 ? '#66bb6a' : pct >= 50 ? '#ffa726' : '#ef5350', height: '100%', borderRadius: 20, transition: 'width 0.5s' }} />
                    </div>
                    <p style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.4rem' }}>
                      {pct >= 75 ? '✅ Good attendance' : pct >= 50 ? '⚠️ Attendance needs improvement' : '❌ Attendance is critically low'}
                    </p>
                  </div>
                </div>

                {/* Day-by-day records */}
                <div className="section-title" style={{ marginTop: '1.5rem' }}>Day-by-Day Records</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Status</th>
                        <th>Remark</th>
                        <th>Marked By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r._id}>
                          <td>
                            {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td style={{ color: '#888', fontSize: '0.85rem' }}>
                            {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                          </td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.8rem', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem',
                              color: statusColor[r.status], background: statusBg[r.status]
                            }}>
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
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;