import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  return (
    <div>
      <div className="hero">
        <h1>Welcome to EduConnect 🎓</h1>
        <p>A modern academic portal connecting teachers, students, and administrators for seamless education management.</p>
        {user && (
          <Link to={`/${user.role}`} className="btn btn-secondary">Go to Dashboard →</Link>
        )}
      </div>

      <div className="about-section">
        <div className="container">
          <h2>About Our School</h2>
          <p style={{ textAlign: 'center', color: '#555', maxWidth: 700, margin: '0 auto', lineHeight: 1.8 }}>
            EduConnect Academic Portal is dedicated to providing quality education from Class 1 to Class 12.
            Our mission is to nurture young minds with a blend of academic excellence, character building, and
            holistic development. With state-of-the-art facilities and experienced faculty, we strive to prepare
            students for the challenges of tomorrow.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="icon">📚</div>
              <h3>Digital Assignments</h3>
              <p>Teachers upload assignments online for Classes 1–12. Students can download anytime.</p>
            </div>
            <div className="feature-card">
              <div className="icon">🔔</div>
              <h3>School Notifications</h3>
              <p>Stay updated with important announcements, events, exams, and holidays.</p>
            </div>
            <div className="feature-card">
              <div className="icon">👨‍🏫</div>
              <h3>Expert Faculty</h3>
              <p>Dedicated teachers committed to delivering quality education across all subjects.</p>
            </div>
            <div className="feature-card">
              <div className="icon">🎯</div>
              <h3>Academic Excellence</h3>
              <p>Structured curriculum ensuring each student reaches their full potential.</p>
            </div>
            <div className="feature-card">
              <div className="icon">🏆</div>
              <h3>Holistic Development</h3>
              <p>Beyond academics — sports, arts, and extracurricular activities for all-round growth.</p>
            </div>
            <div className="feature-card">
              <div className="icon">🔒</div>
              <h3>Secure Portal</h3>
              <p>Role-based access for admins, teachers, and students ensuring data security.</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#e8eaf6', padding: '3rem 2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#1a237e', marginBottom: '1rem' }}>Contact Us</h2>
        <p style={{ color: '#555' }}>📍 123 School Road, Education City, India</p>
        <p style={{ color: '#555' }}>📧 info@educonnect.school | 📞 +91-9999-000000</p>
      </div>

      <footer>
        <p>© 2025 EduConnect Academic Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;