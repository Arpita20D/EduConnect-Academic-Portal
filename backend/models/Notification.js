const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['general', 'exam', 'holiday', 'event', 'urgent'], default: 'general' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);