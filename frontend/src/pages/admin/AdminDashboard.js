import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState('teachers');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher', childName: '', childClass: '' });

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/auth/users');
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
  };

  const fetchAssignments = async () => {
    try {
      const { data } = await axios.get('/api/assignments/public');
      setAssignments(data);
    } catch { toast.error('Failed to load assignments'); }
  };

  useEffect(() => { fetchUsers(); fetchAssignments(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', form);
      toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'teacher', childName: '', childClass: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`/api/auth/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await axios.delete(`/api/assignments/${id}`);
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch { toast.error('Failed to delete'); }
  };

  const teachers = users.filter(u => u.role === 'teacher');
  const parents = users.filter(u => u.role === 'parent');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Welcome, {user.name}! Manage the school portal from here.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{teachers.length}</div><div className="label">Teachers</div></div>
        <div className="stat-card"><div className="num">{parents.length}</div><div className="label">Parents</div></div>
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">Assignments</div></div>
        <div className="stat-card"><div className="num">{[...new Set(assignments.map(a => a.class))].length}</div><div className="label">Classes Active</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'teachers' ? 'active' : ''}`} onClick={() => setTab('teachers')}>👨‍🏫 Teachers</button>
        <button className={`tab ${tab === 'parents' ? 'active' : ''}`} onClick={() => setTab('parents')}>👨‍👩‍👧 Parents</button>
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📋 Assignments</button>
      </div>

      {/* Teachers */}
      {tab === 'teachers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setForm(f => ({ ...f, role: 'teacher' })); setShowModal(true); }}>+ Add Teacher</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
              <tbody>
                {teachers.length === 0
                  ? <tr><td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>No teachers yet</td></tr>
                  : teachers.map(u => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}>Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parents */}
      {tab === 'parents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setForm(f => ({ ...f, role: 'parent' })); setShowModal(true); }}>+ Add Parent</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Parent Name</th><th>Email</th><th>Child Name</th><th>Child Class</th><th>Action</th></tr></thead>
              <tbody>
                {parents.length === 0
                  ? <tr><td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>No parents yet</td></tr>
                  : parents.map(u => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.childName || '—'}</td>
                      <td>{u.childClass ? <span className="badge badge-class">Class {u.childClass}</span> : '—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}>Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignments */}
      {tab === 'assignments' && (
        <div>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            These are the same assignments visible on the public Assignments page.
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Subject</th><th>Class</th><th>Teacher</th><th>Due</th><th>PDF</th><th>Action</th></tr></thead>
              <tbody>
                {assignments.length === 0
                  ? <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>No assignments yet</td></tr>
                  : assignments.map(a => (
                    <tr key={a._id}>
                      <td>{a.title}</td>
                      <td><span className="badge badge-subject">{a.subject}</span></td>
                      <td><span className="badge badge-class">Class {a.class}</span></td>
                      <td>{a.teacherName}</td>
                      <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td>
                        {a.filePath
                          ? <a href={`/uploads/${a.filePath.replace(/\\/g, '/').split('uploads/')[1]}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⬇ PDF</a>
                          : '—'}
                      </td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteAssignment(a._id)}>Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add {form.role.charAt(0).toUpperCase() + form.role.slice(1)}</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="Email address" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Set a password" minLength="6" />
              </div>
              {form.role === 'parent' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Child's Name</label>
                    <input value={form.childName} onChange={e => setForm({ ...form, childName: e.target.value })} required placeholder="Child's full name" />
                  </div>
                  <div className="form-group">
                    <label>Child's Class</label>
                    <select value={form.childClass} onChange={e => setForm({ ...form, childClass: e.target.value })} required>
                      <option value="">Select Class</option>
                      {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Class {i + 1}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;