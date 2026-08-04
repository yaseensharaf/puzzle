require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const puzzleRoutes = require("./routes/puzzleRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Security headers via Helmet.
// CSP is disabled here because MediaPipe loads WASM and its model from two
// external origins (cdn.jsdelivr.net and storage.googleapis.com). Defining a
// correct CSP that doesn't break WebAssembly instantiation requires browser
// testing; all other Helmet headers (X-Content-Type-Options, X-Frame-Options,
// etc.) remain active.
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Rate-limit API endpoints: 100 requests per 15 minutes per IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." },
});
app.use("/api", apiLimiter);

// Body parsers (JSON bodies are small; multipart is handled by Multer)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Serve the SPA from public/
app.use(express.static(path.join(__dirname, "..", "public")));

// Serve uploaded images through a dedicated static route
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/puzzles", puzzleRoutes);

// SPA fallback — any unmatched GET returns index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Centralised error handler — must be the last middleware registered
app.use(errorHandler);

module.exports = app;
