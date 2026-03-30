const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access only' });
  next();
};

const teacherOrAdmin = (req, res, next) => {
  if (!['teacher', 'admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Teacher or Admin access only' });
  next();
};

module.exports = { protect, adminOnly, teacherOrAdmin };