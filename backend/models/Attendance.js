const mongoose = require('mongoose');

// One document per student per date per class
const attendanceSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  class: { type: Number, required: true, min: 1, max: 12 },
  date: { type: String, required: true }, // stored as "YYYY-MM-DD" string for easy lookup
  status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: { type: String },
  remark: { type: String, default: '' },
}, { timestamps: true });

// Ensure one record per student per date per class
attendanceSchema.index({ studentName: 1, class: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);