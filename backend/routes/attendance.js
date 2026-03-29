const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, teacherOrAdmin } = require('../middleware/auth');

// ─── TEACHER: Save or update attendance for a whole class on a date ───────────
// Body: { date, class, students: [{ studentName, status, remark }] }
router.post('/bulk', protect, teacherOrAdmin, async (req, res) => {
  const { date, class: cls, students } = req.body;
  if (!date || !cls || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'date, class, and students[] are required' });
  }
  try {
    const ops = students.map(s => ({
      updateOne: {
        filter: { studentName: s.studentName.trim(), class: Number(cls), date },
        update: {
          $set: {
            status: s.status,
            remark: s.remark || '',
            markedBy: req.user._id,
            teacherName: req.user.name,
          }
        },
        upsert: true,
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── TEACHER: Get attendance records for a class on a specific date ───────────
router.get('/class', protect, teacherOrAdmin, async (req, res) => {
  const { class: cls, date } = req.query;
  if (!cls || !date) return res.status(400).json({ message: 'class and date are required' });
  try {
    const records = await Attendance.find({ class: Number(cls), date }).sort({ studentName: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── TEACHER: Get all unique student names for a class (to pre-fill the form) ─
router.get('/students', protect, teacherOrAdmin, async (req, res) => {
  const { class: cls } = req.query;
  if (!cls) return res.status(400).json({ message: 'class is required' });
  try {
    const names = await Attendance.distinct('studentName', { class: Number(cls) });
    res.json(names.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUBLIC: Parent looks up their child's attendance ─────────────────────────
// Query: ?studentName=Rohit&class=5&month=2025-03  (month optional)
router.get('/public', async (req, res) => {
  const { studentName, class: cls, month } = req.query;
  if (!studentName || !cls) {
    return res.status(400).json({ message: 'studentName and class are required' });
  }
  try {
    const query = {
      studentName: { $regex: new RegExp(`^${studentName.trim()}$`, 'i') },
      class: Number(cls),
    };
    if (month) {
      // month = "YYYY-MM", match all dates starting with that prefix
      query.date = { $regex: `^${month}` };
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUBLIC: Get distinct student names for a class (for autocomplete) ────────
router.get('/public/students', async (req, res) => {
  const { class: cls } = req.query;
  if (!cls) return res.status(400).json({ message: 'class is required' });
  try {
    const names = await Attendance.distinct('studentName', { class: Number(cls) });
    res.json(names.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;