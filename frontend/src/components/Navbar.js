import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={close}>🏫 EduConnect</Link>

      <button className="navbar-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
        {menuOpen ? '✕' : '☰'}
      </button>

      <ul className={`navbar-links${menuOpen ? ' open' : ''}`}>
        <li><Link to="/" onClick={close}>Home</Link></li>
        <li><Link to="/assignments" onClick={close}>Assignments</Link></li>
        <li><Link to="/attendance" onClick={close}>Attendance</Link></li>
        <li><Link to="/notifications" onClick={close}>Notifications</Link></li>
        <li><Link to="/parent-portal" onClick={close}>Parent Portal</Link></li>

        {!user ? (
          <li><Link to="/login" className="nav-login-btn" onClick={close}>Login</Link></li>
        ) : (
          <>
            <li><Link to={`/${user.role}`} onClick={close}>Dashboard</Link></li>
            <li><span className="navbar-user">👤 {user.name}</span></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;