// Production: calls Render backend directly.
// Local dev: uses localhost backend.
const RENDER_API_URL = "https://sql-generator-1.onrender.com";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8080"
    : RENDER_API_URL;
