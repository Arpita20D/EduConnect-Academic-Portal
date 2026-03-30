const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect, teacherOrAdmin } = require('../middleware/auth');

// TEACHER: Save/update attendance for a whole class on a date
router.post('/bulk', protect, teacherOrAdmin, async (req, res) => {
  const { date, class: cls, students } = req.body;
  if (!date || !cls || !Array.isArray(students) || students.length === 0)
    return res.status(400).json({ message: 'date, class, and students[] are required' });
  try {
    const ops = students.map(s => ({
      updateOne: {
        filter: { studentName: s.studentName.trim(), class: Number(cls), date },
        update: { $set: { status: s.status, remark: s.remark || '', markedBy: req.user._id, teacherName: req.user.name } },
        upsert: true,
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: 'Attendance saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TEACHER: Get attendance for a class on a specific date
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

// TEACHER: Get student names for a class (from Student master list)
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

// PUBLIC: Parent looks up child's attendance
router.get('/public', async (req, res) => {
  const { studentName, class: cls, month } = req.query;
  if (!studentName || !cls)
    return res.status(400).json({ message: 'studentName and class are required' });
  try {
    const query = {
      studentName: { $regex: new RegExp(`^${studentName.trim()}$`, 'i') },
      class: Number(cls),
    };
    if (month) query.date = { $regex: `^${month}` };
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Student names for a class (for autocomplete in parent portal)
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