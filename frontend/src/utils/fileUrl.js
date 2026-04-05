// Builds the correct URL for uploaded files (PDFs, images).
// Uses the same base URL as axios so it always points to the right backend.
// REACT_APP_API_URL must be set on Vercel to your Render backend URL.
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fileUrl = (filePath) => {
  if (!filePath) return '#';
  const clean = filePath.replace(/\\/g, '/').split('uploads/')[1];
  return `${BASE}/uploads/${clean}`;
};