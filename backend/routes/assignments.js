const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Assignment = require('../models/Assignment');
const { protect, teacherOrAdmin, adminOnly } = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/assignments';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
}); // 10MB limit

// PUBLIC - Get all assignments (no login needed, for the Assignments page)
router.get('/public', async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload assignment (teacher/admin)
router.post('/', protect, teacherOrAdmin, upload.single('file'), async (req, res) => {
  const { title, description, subject, class: cls, dueDate } = req.body;
  try {
    const assignment = await Assignment.create({
      title, description, subject,
      class: Number(cls), dueDate,
      filePath: req.file ? req.file.path : null,
      fileName: req.file ? req.file.originalname : null,
      uploadedBy: req.user._id,
      teacherName: req.user.name,
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get assignments (filter by class for students)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.class = req.user.class;
    if (req.query.class) query.class = Number(req.query.class);
    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete assignment (teacher who uploaded or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && assignment.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (assignment.filePath && fs.existsSync(assignment.filePath))
      fs.unlinkSync(assignment.filePath);
    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;