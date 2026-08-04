const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE_BYTES = (Number(process.env.UPLOAD_MAX_SIZE_MB) || 10) * 1024 * 1024;

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Create the uploads directory at startup so multer never fails on a missing path.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const unique = `puzzle_${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Only PNG, JPEG, and WebP images are accepted.");
    err.status = 415;
    cb(err);
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_BYTES } });

module.exports = { upload, UPLOAD_DIR };
