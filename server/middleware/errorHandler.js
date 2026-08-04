function errorHandler(err, _req, res, _next) {
  // Multer file-size limit
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: `File exceeds the ${process.env.UPLOAD_MAX_SIZE_MB || 10} MB limit.`,
    });
  }

  // Other Multer errors (unexpected field, etc.)
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, error: err.message });
  }

  const status = err.status || 500;

  // Hide internal details in production
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error."
      : err.message || "Internal server error.";

  if (status === 500) console.error("[Server Error]", err);

  return res.status(status).json({ success: false, error: message });
}

module.exports = { errorHandler };
