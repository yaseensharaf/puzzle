const path = require("path");
const fs = require("fs/promises");
const { pool } = require("../config/database");
const { UPLOAD_DIR } = require("../middleware/upload");

async function createPuzzle({ playerName, imageFilename, completionTimeSeconds, movesCount, score }) {
  const [result] = await pool.execute(
    `INSERT INTO puzzles (player_name, image_path, completion_time_seconds, moves_count, score)
     VALUES (?, ?, ?, ?, ?)`,
    [playerName, imageFilename, completionTimeSeconds, movesCount, score]
  );
  return result.insertId;
}

async function getAllPuzzles() {
  const [rows] = await pool.execute(
    `SELECT id, player_name, image_path, completion_time_seconds, moves_count, score, created_at
     FROM puzzles
     ORDER BY created_at DESC`
  );
  return rows;
}

async function deleteAllPuzzles() {
  const [rows] = await pool.execute("SELECT image_path FROM puzzles");
  await pool.execute("DELETE FROM puzzles");

  // Delete image files; ignore per-file errors (file may already be gone)
  await Promise.allSettled(
    rows.map((row) => fs.unlink(path.join(UPLOAD_DIR, row.image_path)))
  );

  return rows.length;
}

module.exports = { createPuzzle, getAllPuzzles, deleteAllPuzzles };
