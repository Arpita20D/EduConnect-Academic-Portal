const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const ReportCard = require('../models/ReportCard');
const { protect, teacherOrAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/reportcards';
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

// Upload report card (teacher/admin)
router.post('/', protect, teacherOrAdmin, upload.single('file'), async (req, res) => {
  const { studentName, class: cls, term, remarks } = req.body;
  if (!req.file) return res.status(400).json({ message: 'PDF file is required' });
  try {
    const card = await ReportCard.create({
      studentName: studentName.trim(),
      class: Number(cls),
      term,
      filePath: req.file.path,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      teacherName: req.user.name,
      remarks: remarks || '',
    });
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get report cards for a specific student+class (protected - teacher/admin)
router.get('/', protect, teacherOrAdmin, async (req, res) => {
  const { studentName, class: cls } = req.query;
  try {
    const query = {};
    if (studentName) query.studentName = { $regex: new RegExp(studentName.trim(), 'i') };
    if (cls) query.class = Number(cls);
    const cards = await ReportCard.find(query).sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: Parents look up their child's report cards by name + class
router.get('/public', async (req, res) => {
  const { studentName, class: cls } = req.query;
  if (!studentName || !cls)
    return res.status(400).json({ message: 'studentName and class are required' });
  try {
    const cards = await ReportCard.find({
      studentName: { $regex: new RegExp(`^${studentName.trim()}$`, 'i') },
      class: Number(cls),
    }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete report card (teacher/admin)
router.delete('/:id', protect, teacherOrAdmin, async (req, res) => {
  try {
    const card = await ReportCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Not found' });
    if (fs.existsSync(card.filePath)) fs.unlinkSync(card.filePath);
    await card.deleteOne();
    res.json({ message: 'Report card deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;