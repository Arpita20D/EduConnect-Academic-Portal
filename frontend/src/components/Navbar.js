import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🏫 EduConnect</Link>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/assignments">Assignments</Link></li>
        <li><Link to="/notifications">Notifications</Link></li>
        {!user ? (
          <li><Link to="/login">Login</Link></li>
        ) : (
          <>
            <li><Link to={`/${user.role}`}>Dashboard</Link></li>
            <li><span className="navbar-user">👤 {user.name} ({user.role})</span></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;