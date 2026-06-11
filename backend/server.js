require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!process.env.GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY in environment variables");
  process.exit(1);
}

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
  : [];

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app");

    if (isAllowed) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "AI SQL Generator API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, max_tokens, temperature } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: "messages array is required" } });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: max_tokens ?? 500,
        temperature: temperature ?? 0.3
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Groq proxy error:", error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
