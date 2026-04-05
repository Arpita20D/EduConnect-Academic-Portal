const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from any origin so both local dev and Vercel frontend work.
// If you want to lock it down after deployment, replace the origin with your
// Vercel URL: e.g. origin: 'https://your-app.vercel.app'
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/assignments',   require('./routes/assignments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/reportcards',   require('./routes/reportcards'));
app.use('/api/students',      require('./routes/students'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));