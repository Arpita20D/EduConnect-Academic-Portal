const mongoose = require('mongoose');

const reportCardSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  class: { type: Number, required: true, min: 1, max: 12 },
  term: { type: String, required: true }, // e.g. "Term 1 2025", "Final 2025"
  filePath: { type: String, required: true },
  fileName: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: { type: String },
  remarks: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ReportCard', reportCardSchema);
