-- Puzzle Cam — MySQL initialisation script
-- Run once: mysql -u root -p < init.sql

CREATE DATABASE IF NOT EXISTS puzzlecam
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE puzzlecam;

CREATE TABLE IF NOT EXISTS puzzles (
  id                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  player_name             VARCHAR(100)  NOT NULL DEFAULT 'Guest',
  image_path              VARCHAR(500)  NOT NULL,
  completion_time_seconds INT UNSIGNED  NOT NULL DEFAULT 0,
  moves_count             INT UNSIGNED  NOT NULL DEFAULT 0,
  score                   INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
