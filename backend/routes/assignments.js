const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const fs      = require('fs');
const Assignment = require('../models/Assignment');
const { protect, teacherOrAdmin } = require('../middleware/auth');

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
});

// PUBLIC — all assignments (no login needed)
router.get('/public', async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload assignment (teacher or admin)
// Admin can pass teacherNameOverride to specify which teacher uploaded it
router.post('/', protect, teacherOrAdmin, upload.single('file'), async (req, res) => {
  const { title, description, subject, class: cls, dueDate, teacherNameOverride } = req.body;
  if (!req.file) return res.status(400).json({ message: 'PDF file is required' });
  try {
    // Use override if admin provides one, otherwise use logged-in user's name
    const teacherName = (req.user.role === 'admin' && teacherNameOverride)
      ? teacherNameOverride.trim()
      : req.user.name;

    const assignment = await Assignment.create({
      title, description, subject,
      class: Number(cls),
      dueDate: dueDate || null,
      filePath: req.file.path,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      teacherName,
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected GET (for dashboards that need auth)
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.class) query.class = Number(req.query.class);
    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete (teacher who uploaded or admin)
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