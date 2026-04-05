import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// ─── Set axios baseURL for ALL api calls ─────────────────────────────────────
// In development: REACT_APP_API_URL is not set, so baseURL is empty string,
//   meaning requests go to the same origin (localhost:3000) — but since we
//   removed the CRA proxy we need the dev server running on localhost:5000.
//   So for local development set REACT_APP_API_URL=http://localhost:5000
//   in a .env.local file (never commit this file).
// In production (Vercel): REACT_APP_API_URL is set to your Render backend URL
//   e.g. https://educonnect-backend.onrender.com
// This one line fixes ALL axios calls everywhere with zero changes to components.
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);