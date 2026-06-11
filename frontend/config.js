// Local dev: talks directly to the backend on port 8080.
// Production (Vercel): empty string uses /api/chat via vercel.json rewrites.
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8080"
    : "";
