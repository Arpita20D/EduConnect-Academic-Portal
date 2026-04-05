const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fileUrl = (filePath) => {
  if (!filePath) return '#';
  const clean = filePath.replace(/\\/g, '/').split('uploads/')[1];
  return `${BASE}/uploads/${clean}`;
};