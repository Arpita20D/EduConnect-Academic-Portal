// Helper to build correct file download URLs in both dev and production.
// In development: uses localhost:5000 (via proxy)
// In production: uses REACT_APP_API_URL set in Vercel environment variables
const BASE = process.env.REACT_APP_API_URL || '';

export const fileUrl = (filePath) => {
  if (!filePath) return '#';
  const clean = filePath.replace(/\\/g, '/').split('uploads/')[1];
  // In dev, BASE is empty so the path stays relative (works via CRA proxy)
  // In production, BASE is the Render URL so the full URL is built correctly
  return BASE ? `${BASE}/uploads/${clean}` : `/uploads/${clean}`;
};