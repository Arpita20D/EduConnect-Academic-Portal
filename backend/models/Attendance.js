const mongoose = require('mongoose');

// Monthly attendance — one record per student per month
// Stores numbers: totalDays, daysPresent so parent can see percentage
const attendanceSchema = new mongoose.Schema({
  studentName:  { type: String, required: true, trim: true },
  class:        { type: Number, required: true, min: 1, max: 12 },
  month:        { type: String, required: true }, // "YYYY-MM"  e.g. "2025-03"
  totalDays:    { type: Number, required: true, min: 1 },
  daysPresent:  { type: Number, required: true, min: 0 },
  daysAbsent:   { type: Number, default: 0 },
  daysLate:     { type: Number, default: 0 },
  remarks:      { type: String, default: '' },
  markedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName:  { type: String },
}, { timestamps: true });

// One record per student per month per class
attendanceSchema.index({ studentName: 1, class: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);