import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { fileUrl } from '../utils/fileUrl';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [search, setSearch]           = useState('');
  const [showUpload, setShowUpload]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', subject: '', class: '', dueDate: '', teacherNameOverride: ''
  });
  const [file, setFile] = useState(null);

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get('/api/assignments/public');
      setAssignments(data);
    } catch {
      toast.error('Failed to load assignments');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please attach a PDF file');
    setSubmitting(true);
    const formData = new FormData();
    formData.append('title',       form.title);
    formData.append('description', form.description);
    formData.append('subject',     form.subject);
    formData.append('class',       form.class);
    formData.append('dueDate',     form.dueDate);
    if (user.role === 'admin' && form.teacherNameOverride.trim()) {
      formData.append('teacherNameOverride', form.teacherNameOverride.trim());
    }
    formData.append('file', file);
    try {
      await axios.post('/api/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Assignment uploaded!');
      setShowUpload(false);
      setForm({ title: '', description: '', subject: '', class: '', dueDate: '', teacherNameOverride: '' });
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
    } catch {
      toast.error('Failed to delete');
    }
  };

  const subjectOptions = [...new Set(
    assignments
      .filter(a => !filterClass || a.class === Number(filterClass))
      .map(a => a.subject)
  )].sort();

  const filtered = assignments.filter(a => {
    const matchClass   = !filterClass   || a.class === Number(filterClass);
    const matchSubject = !filterSubject || a.subject === filterSubject;
    const matchSearch  = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase()) ||
      (a.teacherName || '').toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSubject && matchSearch;
  });

  const isTeacherOrAdmin = user && (user.role === 'teacher' || user.role === 'admin');

  return (
    <div className="container">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>📚 Assignments</h1>
        {isTeacherOrAdmin && (
          <button className="btn btn-primary" onClick={() => setShowUpload(o => !o)}>
            {showUpload ? '✕ Cancel' : '+ Upload Assignment'}
          </button>
        )}
      </div>

      {showUpload && isTeacherOrAdmin && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid #3949ab' }}>
          <h3 style={{ color: '#1a237e', marginBottom: '1rem' }}>📤 Upload New Assignment</h3>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Assignment Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Chapter 5 – Algebra Worksheet" />
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
            {user.role === 'admin' && (
              <div className="form-group">
                <label>Teacher Name *</label>
                <input value={form.teacherNameOverride} onChange={e => setForm({ ...form, teacherNameOverride: e.target.value })} required placeholder="Enter the teacher's name for this assignment" />
              </div>
            )}
            {user.role === 'teacher' && (
              <div className="form-group">
                <label>Teacher Name</label>
                <input value={user.name} disabled style={{ background: '#f5f5f5', color: '#666' }} />
                <small style={{ color: '#888' }}>Your name is automatically attached to this assignment.</small>
              </div>
            )}
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2" placeholder="Brief instructions for students..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Due Date (optional)</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>PDF File *</label>
                <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
                <small style={{ color: '#888' }}>Only PDF · max 10 MB</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Uploading...' : '⬆ Upload'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>🔍 Search</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Title, subject or teacher..." />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📖 Class</label>
            <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSubject(''); }}>
              <option value="">All Classes</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>📝 Subject</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { setFilterClass(''); setFilterSubject(''); setSearch(''); }}>✕ Clear</button>
          </div>
        </div>
      </div>

      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Showing <strong>{filtered.length}</strong> assignment{filtered.length !== 1 ? 's' : ''}
        {filterClass   && ` · Class ${filterClass}`}
        {filterSubject && ` · ${filterSubject}`}
      </p>

      {loading ? (
        <div className="loading">Loading assignments...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No assignments found. Try changing your filters.</p></div>
      ) : (
        filtered.map(a => (
          <div key={a._id} className="card">
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <h3>{a.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <span className="badge badge-class">Class {a.class}</span>
                  <span className="badge badge-subject">{a.subject}</span>
                  {a.dueDate && new Date(a.dueDate) < new Date() && <span className="badge badge-urgent">OVERDUE</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexShrink: 0 }}>
                {a.filePath && (
                  <a href={fileUrl(a.filePath)} download target="_blank" rel="noreferrer" className="btn btn-success btn-sm">⬇ Download PDF</a>
                )}
                {isTeacherOrAdmin && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}>Delete</button>
                )}
              </div>
            </div>
            {a.description && <p style={{ color: '#555', margin: '0.5rem 0', lineHeight: 1.6 }}>{a.description}</p>}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.83rem', color: '#888', flexWrap: 'wrap' }}>
              <span>👨‍🏫 <strong>{a.teacherName}</strong></span>
              {a.dueDate && <span>📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              <span>🗓 Posted: {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {a.fileName && <span>📎 {a.fileName}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Assignments;