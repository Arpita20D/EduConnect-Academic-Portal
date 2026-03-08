import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState('users');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });

  const fetchUsers = async () => {
    const { data } = await axios.get('/api/auth/users');
    setUsers(data);
  };

  const fetchAssignments = async () => {
    const { data } = await axios.get('/api/assignments');
    setAssignments(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchAssignments();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', form);
      toast.success('Teacher account created!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'teacher' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try {
      await axios.delete(`/api/auth/users/${id}`);
      toast.success('Teacher deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await axios.delete(`/api/assignments/${id}`);
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const teachers = users.filter(u => u.role === 'teacher');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user.name}! Manage teachers, assignments, and notifications.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="num">{teachers.length}</div>
          <div className="label">Teachers</div>
        </div>
        <div className="stat-card">
          <div className="num">{assignments.length}</div>
          <div className="label">Total Assignments</div>
        </div>
        <div className="stat-card">
          <div className="num">{[...new Set(assignments.map(a => a.class))].length}</div>
          <div className="label">Classes Covered</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>👥 Manage Teachers</button>
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📋 All Assignments</button>
      </div>

      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Teacher</button>
          </div>
          <div className="section-title">Teachers ({teachers.length})</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
              </thead>
              <tbody>
                {teachers.length === 0
                  ? <tr><td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>No teachers added yet</td></tr>
                  : teachers.map(u => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-subject">Teacher</span></td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}>Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            These are the same assignments visible on the public <strong>Assignments</strong> page where anyone can search and download them.
          </p>
          <div className="section-title">All Assignments ({assignments.length})</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Subject</th><th>Class</th><th>Teacher</th><th>Due Date</th><th>PDF</th><th>Action</th></tr>
              </thead>
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
                          ? <a href={`http://localhost:5000/${a.filePath}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⬇ PDF</a>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Teacher</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Teacher's full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="Email address" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Set a password" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;