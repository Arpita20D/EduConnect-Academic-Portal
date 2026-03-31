const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student    = require('../models/Student');
const { protect, teacherOrAdmin } = require('../middleware/auth');

/* ─── TEACHER / ADMIN: Save monthly attendance for a whole class ─────────────
   Body: { month: "YYYY-MM", class: 5,
           students: [{ studentName, totalDays, daysPresent, daysAbsent, daysLate, remarks }] }
*/
router.post('/monthly', protect, teacherOrAdmin, async (req, res) => {
  const { month, class: cls, students } = req.body;
  if (!month || !cls || !Array.isArray(students) || students.length === 0)
    return res.status(400).json({ message: 'month, class, and students[] are required' });
  try {
    const ops = students.map(s => ({
      updateOne: {
        filter: { studentName: s.studentName.trim(), class: Number(cls), month },
        update: {
          $set: {
            totalDays:   Number(s.totalDays),
            daysPresent: Number(s.daysPresent),
            daysAbsent:  Number(s.daysAbsent  || 0),
            daysLate:    Number(s.daysLate     || 0),
            remarks:     s.remarks || '',
            markedBy:    req.user._id,
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

/* ─── TEACHER / ADMIN: Get monthly attendance for a class ─────────────────── */
router.get('/monthly', protect, teacherOrAdmin, async (req, res) => {
  const { class: cls, month } = req.query;
  if (!cls || !month) return res.status(400).json({ message: 'class and month are required' });
  try {
    const records = await Attendance.find({ class: Number(cls), month }).sort({ studentName: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── TEACHER: Get student names for a class (from master list) ──────────── */
router.get('/students', protect, teacherOrAdmin, async (req, res) => {
  const { class: cls } = req.query;
  if (!cls) return res.status(400).json({ message: 'class is required' });
  try {
    const students = await Student.find({ class: Number(cls) }).sort({ name: 1 }).select('name');
    res.json(students.map(s => s.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── PUBLIC: Parent looks up child's monthly attendance ─────────────────── */
router.get('/public', async (req, res) => {
  const { studentName, class: cls, month } = req.query;
  if (!studentName || !cls)
    return res.status(400).json({ message: 'studentName and class are required' });
  try {
    const query = {
      studentName: { $regex: new RegExp(`^${studentName.trim()}$`, 'i') },
      class: Number(cls),
    };
    if (month) query.month = month;
    const records = await Attendance.find(query).sort({ month: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── PUBLIC: Student names for autocomplete ─────────────────────────────── */
router.get('/public/students', async (req, res) => {
  const { class: cls } = req.query;
  if (!cls) return res.status(400).json({ message: 'class is required' });
  try {
    const students = await Student.find({ class: Number(cls) }).sort({ name: 1 }).select('name');
    res.json(students.map(s => s.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;