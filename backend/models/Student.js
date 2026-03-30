const mongoose = require('mongoose');

// Simple student record — no login. Admin adds them, teachers reference them.
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  class: { type: Number, required: true, min: 1, max: 12 },
  rollNumber: { type: String, default: '' },
  parentName: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// One student name per class (prevent duplicates)
studentSchema.index({ name: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);