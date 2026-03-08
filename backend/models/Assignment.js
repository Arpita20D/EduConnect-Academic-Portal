const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  class: { type: Number, required: true, min: 1, max: 12 },
  dueDate: { type: Date },
  filePath: { type: String },
  fileName: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);