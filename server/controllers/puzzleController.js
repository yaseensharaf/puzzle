const path = require("path");
const fs = require("fs/promises");
const { createPuzzle, getAllPuzzles, deleteAllPuzzles } = require("../services/puzzleService");
const { UPLOAD_DIR } = require("../middleware/upload");

function formatPuzzle(row) {
  return {
    id: row.id,
    playerName: row.player_name,
    completionTimeSeconds: row.completion_time_seconds,
    movesCount: row.moves_count,
    score: row.score,
    image_url: `/uploads/${row.image_path}`,
    createdAt: row.created_at,
  };
}

async function savePuzzle(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No image uploaded." });
  }

  const { file } = req;

  try {
    const playerName =
      String(req.body.playerName || "Guest")
        .trim()
        .slice(0, 100) || "Guest";

    const completionTimeSeconds = Math.max(
      0,
      parseInt(req.body.completionTimeSeconds, 10) || 0
    );
    const movesCount = Math.max(0, parseInt(req.body.movesCount, 10) || 0);
    const score = Math.max(0, parseInt(req.body.score, 10) || 0);

    const insertId = await createPuzzle({
      playerName,
      imageFilename: file.filename,
      completionTimeSeconds,
      movesCount,
      score,
    });

    return res.status(201).json({
      success: true,
      puzzle: {
        id: insertId,
        playerName,
        completionTimeSeconds,
        movesCount,
        score,
        image_url: `/uploads/${file.filename}`,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Remove the uploaded file if the DB insert failed to avoid orphaned files.
    await fs.unlink(path.join(UPLOAD_DIR, file.filename)).catch(() => {});
    return next(err);
  }
}

async function getPuzzles(req, res, next) {
  try {
    const rows = await getAllPuzzles();
    return res.json({ success: true, puzzles: rows.map(formatPuzzle) });
  } catch (err) {
    return next(err);
  }
}

async function deletePuzzles(req, res, next) {
  try {
    const count = await deleteAllPuzzles();
    return res.json({ success: true, message: `${count} puzzle(s) deleted.` });
  } catch (err) {
    return next(err);
  }
}

module.exports = { savePuzzle, getPuzzles, deletePuzzles };
