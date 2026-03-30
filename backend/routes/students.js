const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect, adminOnly, teacherOrAdmin } = require('../middleware/auth');

// Add student (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, class: cls, rollNumber, parentName } = req.body;
  if (!name || !cls) return res.status(400).json({ message: 'Name and class are required' });
  try {
    const student = await Student.create({
      name: name.trim(),
      class: Number(cls),
      rollNumber: rollNumber || '',
      parentName: parentName || '',
      addedBy: req.user._id,
    });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Student already exists in this class' });
    res.status(500).json({ message: err.message });
  }
});

// Get all students or filter by class
router.get('/', protect, teacherOrAdmin, async (req, res) => {
  try {
    const query = req.query.class ? { class: Number(req.query.class) } : {};
    const students = await Student.find(query).sort({ class: 1, name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: get student names for a class (used by teacher attendance form + parent portal autocomplete)
router.get('/public', async (req, res) => {
  try {
    const query = req.query.class ? { class: Number(req.query.class) } : {};
    const students = await Student.find(query).sort({ name: 1 }).select('name class rollNumber');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete student (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;