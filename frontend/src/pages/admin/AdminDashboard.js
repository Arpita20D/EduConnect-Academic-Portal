import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users,       setUsers]       = useState([]);
  const [students,    setStudents]    = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState('teachers');

  const [showUserModal,    setShowUserModal]    = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const emptyUser    = { name: '', email: '', password: '', role: 'teacher' };
  const emptyStudent = { name: '', class: '', rollNumber: '', parentName: '' };
  const [userForm,    setUserForm]    = useState(emptyUser);
  const [studentForm, setStudentForm] = useState(emptyStudent);

  const fetchUsers = async () => {
    try { const { data } = await axios.get('/api/auth/users'); setUsers(data); }
    catch { toast.error('Failed to load users'); }
  };
  const fetchStudents = async () => {
    try { const { data } = await axios.get('/api/students'); setStudents(data); }
    catch { toast.error('Failed to load students'); }
  };
  const fetchAssignments = async () => {
    try { const { data } = await axios.get('/api/assignments/public'); setAssignments(data); }
    catch { toast.error('Failed to load assignments'); }
  };

  useEffect(() => { fetchUsers(); fetchStudents(); fetchAssignments(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', userForm);
      toast.success('Account created!');
      setShowUserModal(false); setUserForm(emptyUser); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/students', studentForm);
      toast.success('Student added!');
      setShowStudentModal(false); setStudentForm(emptyStudent); fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteUser    = async (id) => { if (!window.confirm('Delete?')) return; try { await axios.delete(`/api/auth/users/${id}`); fetchUsers(); toast.success('Deleted'); } catch { toast.error('Failed'); } };
  const handleDeleteStudent = async (id) => { if (!window.confirm('Remove student?')) return; try { await axios.delete(`/api/students/${id}`); fetchStudents(); toast.success('Removed'); } catch { toast.error('Failed'); } };
  const handleDeleteAssignment = async (id) => { if (!window.confirm('Delete?')) return; try { await axios.delete(`/api/assignments/${id}`); fetchAssignments(); toast.success('Deleted'); } catch { toast.error('Failed'); } };

  const teachers = users.filter(u => u.role === 'teacher');
  const studentsByClass = students.reduce((acc, s) => {
    const k = `Class ${s.class}`;
    if (!acc[k]) acc[k] = [];
    acc[k].push(s); return acc;
  }, {});

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Welcome, {user.name}! Manage teachers, students, assignments and more.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="num">{teachers.length}</div><div className="label">Teachers</div></div>
        <div className="stat-card"><div className="num">{students.length}</div><div className="label">Students</div></div>
        <div className="stat-card"><div className="num">{assignments.length}</div><div className="label">Assignments</div></div>
        <div className="stat-card"><div className="num">{[...new Set(students.map(s => s.class))].length}</div><div className="label">Classes</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'teachers'    ? 'active' : ''}`} onClick={() => setTab('teachers')}>👨‍🏫 Teachers</button>
        <button className={`tab ${tab === 'students'    ? 'active' : ''}`} onClick={() => setTab('students')}>🧑‍🎓 Students</button>
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>📋 Assignments</button>
        <button className={`tab ${tab === 'upload'      ? 'active' : ''}`} onClick={() => setTab('upload')}>📊 Attendance &amp; Results</button>
      </div>

      {/* ── Teachers ── */}
      {tab === 'teachers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setUserForm(emptyUser); setShowUserModal(true); }}>+ Add Teacher</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
              <tbody>
                {teachers.length === 0
                  ? <tr><td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>No teachers yet</td></tr>
                  : teachers.map(u => (
                    <tr key={u._id}>
                      <td>{u.name}</td><td>{u.email}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}>Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Students ── */}
      {tab === 'students' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
              Students added here appear in teacher attendance forms and parent portal search.
            </p>
            <button className="btn btn-primary" onClick={() => { setStudentForm(emptyStudent); setShowStudentModal(true); }}>+ Add Student</button>
          </div>
          {students.length === 0 ? (
            <div className="empty-state"><div className="icon">🧑‍🎓</div><p>No students added yet.</p></div>
          ) : (
            Object.keys(studentsByClass)
              .sort((a, b) => parseInt(a.replace('Class ', '')) - parseInt(b.replace('Class ', '')))
              .map(cls => (
                <div key={cls}>
                  <div className="section-title">{cls} — {studentsByClass[cls].length} student{studentsByClass[cls].length !== 1 ? 's' : ''}</div>
                  <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
                    <table>
                      <thead><tr><th>Name</th><th>Roll No.</th><th>Parent Name</th><th>Action</th></tr></thead>
                      <tbody>
                        {studentsByClass[cls].map(s => (
                          <tr key={s._id}>
                            <td><strong>{s.name}</strong></td>
                            <td>{s.rollNumber || '—'}</td>
                            <td>{s.parentName || '—'}</td>
                            <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(s._id)}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ── Assignments ── */}
      {tab === 'assignments' && (
        <div>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            All assignments visible on the public Assignments page.
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
                      <td>{a.filePath ? <a href={`/uploads/${a.filePath.replace(/\\/g, '/').split('uploads/')[1]}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">⬇ PDF</a> : '—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteAssignment(a._id)}>Delete</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Attendance & Results — link to the Attendance page ── */}
      {tab === 'upload' && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ color: '#1a237e', marginBottom: '0.8rem' }}>Attendance &amp; Results Upload</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: 500, margin: '0 auto 1.5rem' }}>
            Go to the Attendance page to upload monthly attendance numbers for any class, and to upload individual student result PDFs. Both features are available there for admin and teachers.
          </p>
          <Link to="/attendance" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
            Go to Attendance &amp; Results Page →
          </Link>
        </div>
      )}

      {/* ── Add Teacher Modal ── */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Teacher Account</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required placeholder="Teacher's full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required placeholder="Email address" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required placeholder="Min 6 characters" minLength="6" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Student Modal ── */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Student</h2>
            <form onSubmit={handleAddStudent}>
              <div className="form-row">
                <div className="form-group">
                  <label>Student Name *</label>
                  <input value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label>Class *</label>
                  <select value={studentForm.class} onChange={e => setStudentForm({ ...studentForm, class: e.target.value })} required>
                    <option value="">Select Class</option>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Roll Number (optional)</label>
                  <input value={studentForm.rollNumber} onChange={e => setStudentForm({ ...studentForm, rollNumber: e.target.value })} placeholder="e.g. 21" />
                </div>
                <div className="form-group">
                  <label>Parent Name (optional)</label>
                  <input value={studentForm.parentName} onChange={e => setStudentForm({ ...studentForm, parentName: e.target.value })} placeholder="Father/Mother name" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStudentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;