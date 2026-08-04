<div align="center">

# Puzzle Cam

**A gesture-controlled photo puzzle game — no mouse, no touchscreen, just your hands.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-00C4B4?logo=google&logoColor=white)](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)

</div>

---

## Overview

**Puzzle Cam** is a full-stack web application that turns a webcam into a hands-free camera and puzzle controller. Using real-time hand-landmark detection, players frame and capture a photo, watch it get sliced into a shuffled 3×3 grid, and reassemble it — all using pinch and fist gestures. Completed puzzles, along with player metadata (name, time, moves, score), are persisted to a MySQL database and served back through a REST API.

The project pairs a dependency-free, canvas-based frontend with a small, security-conscious Express backend, making it a compact example of combining real-time computer vision (via [MediaPipe HandLandmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)) with a conventional CRUD API.

> **Screenshot**
>
> ![Puzzle Cam gameplay screenshot](docs/screenshots/gameplay.png)
>
> *Replace with an actual gameplay capture.*

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Gesture Controls](#gesture-controls)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Security](#security)
- [Error Handling](#error-handling)
- [Performance Optimizations](#performance-optimizations)
- [Troubleshooting](#troubleshooting)
- [Deployment Notes](#deployment-notes)
- [Future Improvements](#future-improvements)
- [Credits](#credits)
- [License](#license)

## Features

- **Hands-free camera capture** — frame a shot with both index fingers, then pinch to trigger a countdown and snapshot.
- **Gesture-driven puzzle solving** — pinch-and-drag to move pieces on a shuffled 3×3 board; no pointer input required.
- **Automatic puzzle scoring** — tracks completion time and move count and computes a score on solve.
- **Persistent puzzle gallery** — solved puzzles and their metadata are saved to MySQL and served back via a REST API.
- **Safe file handling** — uploaded images are validated by MIME type and size before being written to disk.
- **Resilient API layer** — rate-limited endpoints, centralized error handling, and orphan-file cleanup on failed writes.
- **Graceful startup and shutdown** — the server verifies database connectivity before accepting traffic and drains connections cleanly on `SIGINT`/`SIGTERM`.

## Gesture Controls

| Gesture | Action |
|---|---|
| Raise two index fingers | Frame the shot on screen |
| Pinch with both hands | Start the capture countdown |
| Pinch with one hand | Drag a puzzle piece |
| Close a fist | Save the puzzle if solved, or discard it if unsolved |

> **Tip:** Hand tracking works best in a well-lit room with the webcam roughly at chest-to-eye height and both hands clearly visible in frame.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Vanilla JavaScript, HTML5 Canvas | Rendering, gesture-driven puzzle interaction |
| Computer vision | MediaPipe Tasks Vision (HandLandmarker) | Real-time hand landmark detection in-browser |
| Backend | Node.js, Express 4 | HTTP server and REST API |
| Database | MySQL 8 | Persistent storage for puzzle records |
| Database driver | mysql2/promise | Connection pooling, prepared statements |
| File uploads | Multer | Multipart form handling, disk storage |
| Security | Helmet, express-rate-limit | HTTP security headers, request throttling |
| Configuration | dotenv | Environment-based configuration |
| Dev tooling | Nodemon | Auto-restart during development |

## Architecture

Puzzle Cam is a monolithic Express application serving a static, single-page frontend alongside a JSON REST API:

```
Browser (public/app.js)
   │  MediaPipe HandLandmarker runs entirely client-side
   │  Canvas renders camera feed, puzzle grid, and UI
   │
   ├── multipart/form-data  ──────────────►  POST /api/puzzles
   ├── fetch                ──────────────►  GET  /api/puzzles
   └── fetch                ──────────────►  DELETE /api/puzzles
                                                    │
                                     Express Router (routes/)
                                                    │
                                     Controller (controllers/)
                                        │                  │
                                   Multer                Service (services/)
                              (upload validation,               │
                               disk storage)                mysql2 pool
                                                                 │
                                                             MySQL 8
```

The codebase follows a layered structure typical of small Express services:

- **Routes** map HTTP verbs/paths to controller functions.
- **Controllers** parse and validate request data, orchestrate the response, and delegate persistence to services.
- **Services** own all SQL access via parameterized queries.
- **Middleware** handles cross-cutting concerns: file uploads (Multer) and centralized error formatting.

## Project Structure

```
puzzle/
├── public/                      # Static frontend, served directly by Express
│   ├── index.html               # App shell / entry HTML
│   ├── app.js                   # Camera capture, gesture detection, puzzle logic
│   └── css/
│       └── styles.css           # Application styling
├── server/
│   ├── server.js                # Entry point — DB check, listen, graceful shutdown
│   ├── app.js                   # Express app: middleware, static hosting, routes
│   ├── config/
│   │   └── database.js          # mysql2 connection pool + connectivity check
│   ├── controllers/
│   │   └── puzzleController.js  # Request handling for /api/puzzles
│   ├── services/
│   │   └── puzzleService.js     # SQL queries (prepared statements)
│   ├── middleware/
│   │   ├── upload.js            # Multer config — MIME/type/size validation
│   │   └── errorHandler.js      # Centralized error-to-JSON formatter
│   ├── routes/
│   │   └── puzzleRoutes.js      # /api/puzzles route definitions
│   └── uploads/                 # Saved puzzle images (gitignored)
├── init.sql                     # One-time database and table creation script
├── .env.example                 # Template for required environment variables
└── package.json                 # Scripts and dependencies
```

## Requirements

- **Node.js** 18 or newer
- **MySQL** 8 or newer
- A **webcam**
- **Google Chrome** or **Microsoft Edge** (required for MediaPipe's WebAssembly runtime)

## Installation

1. **Clone the repository and install dependencies**

   ```powershell
   npm install
   ```

2. **Create the database and table**

   ```powershell
   mysql -u root -p < init.sql
   ```

   If `mysql` is not on your `PATH`, invoke it directly:

   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < init.sql
   ```

3. **Configure environment variables**

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   Fill in your MySQL credentials (see [Environment Variables](#environment-variables) below).

4. **Start the server**

   ```powershell
   npm run dev
   ```

5. **Open the app**

   Navigate to **http://localhost:3000** in Chrome or Edge and grant camera access when prompted.

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `3000` |
| `NODE_ENV` | Runtime environment (`development` \| `production`) | `development` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | *(required)* |
| `DB_NAME` | Database name | `puzzlecam` |
| `UPLOAD_MAX_SIZE_MB` | Maximum accepted image upload size, in megabytes | `10` |

> **Warning:** Never commit a populated `.env` file. It is already excluded via `.gitignore` — keep it that way, and rotate any credentials that are accidentally exposed.

## Development

| Command | Description |
|---|---|
| `npm install` | Installs all runtime and development dependencies. |
| `npm run dev` | Starts the server with **Nodemon**, restarting automatically on file changes. Use this while developing. |
| `npm start` | Starts the server with plain `node`, matching how it runs in production. |

On startup, `server.js` verifies MySQL connectivity via a pooled `ping()` before the HTTP server begins accepting requests. If the database is unreachable, the process logs the failure and exits with a non-zero code rather than serving a broken app.

## API Documentation

All endpoints are mounted under `/api/puzzles` and are rate-limited to **100 requests per 15 minutes per IP address**.

### `POST /api/puzzles`

Saves a completed puzzle and its image.

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `image` | file | Yes | PNG, JPEG, or WebP; max `UPLOAD_MAX_SIZE_MB` (default 10 MB) |
| `playerName` | string | No | Max 100 characters; defaults to `Guest` |
| `completionTimeSeconds` | number | No | Seconds taken to solve; defaults to `0` |
| `movesCount` | number | No | Total piece moves; defaults to `0` |
| `score` | number | No | Computed score; defaults to `0` |

**Response — `201 Created`**

```json
{
  "success": true,
  "puzzle": {
    "id": 1,
    "playerName": "Guest",
    "completionTimeSeconds": 42,
    "movesCount": 18,
    "score": 950,
    "image_url": "/uploads/puzzle_1712345678_ab12cd34.png",
    "createdAt": "2026-08-04T12:00:00.000Z"
  }
}
```

**Response — `400 Bad Request`** (no file attached)

```json
{ "success": false, "error": "No image uploaded." }
```

### `GET /api/puzzles`

Returns all saved puzzles, ordered most recent first.

**Response — `200 OK`**

```json
{
  "success": true,
  "puzzles": [
    {
      "id": 1,
      "playerName": "Guest",
      "completionTimeSeconds": 42,
      "movesCount": 18,
      "score": 950,
      "image_url": "/uploads/puzzle_1712345678_ab12cd34.png",
      "createdAt": "2026-08-04T12:00:00.000Z"
    }
  ]
}
```

### `DELETE /api/puzzles`

Deletes every saved puzzle record and its corresponding image file from disk.

**Response — `200 OK`**

```json
{ "success": true, "message": "3 puzzle(s) deleted." }
```

## Database

Puzzle Cam uses a single MySQL table, `puzzles`, defined in [`init.sql`](init.sql):

```sql
CREATE TABLE puzzles (
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
```

- `image_path` stores only the generated filename; images are served statically from `/uploads`.
- All queries run through `mysql2/promise` using a connection pool (`waitForConnections: true`, `connectionLimit: 10`) and parameterized (`?`) placeholders — no string-concatenated SQL anywhere in the codebase.
- `DELETE /api/puzzles` removes matching rows and then best-effort deletes the associated image files (`Promise.allSettled`, so one missing file doesn't abort the batch).

## Security

| Control | Implementation |
|---|---|
| HTTP security headers | [Helmet](https://helmetjs.github.io/) applied globally |
| Rate limiting | `express-rate-limit` — 100 requests / 15 min per IP on `/api/*` |
| SQL injection prevention | All queries use `mysql2` prepared statements with parameter binding |
| Upload validation | Multer `fileFilter` restricts uploads to `image/png`, `image/jpeg`, `image/webp`; size capped by `UPLOAD_MAX_SIZE_MB` |
| Filename safety | Uploaded files are renamed to a random, collision-resistant name (`crypto.randomBytes`) — the original filename is never trusted |
| Input sanitization | `playerName` is trimmed and truncated server-side; numeric fields are coerced and clamped to non-negative integers |
| Body size limits | JSON and URL-encoded bodies capped at 1 MB |
| Secrets management | Credentials are read from environment variables via `dotenv`; `.env` is gitignored |

> **Note:** Content-Security-Policy is intentionally disabled in Helmet's configuration because MediaPipe loads its WebAssembly runtime from `cdn.jsdelivr.net` and its model weights from `storage.googleapis.com`. All other Helmet-provided headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.) remain active.

## Error Handling

- A centralized Express error-handling middleware (`middleware/errorHandler.js`) formats every failure into a consistent `{ success: false, error: string }` JSON payload.
- Multer file-size violations are mapped to `413 Payload Too Large`; other Multer errors (invalid field, disallowed MIME type) map to `400 Bad Request`.
- Unhandled server errors return `500 Internal Server Error`. In production (`NODE_ENV=production`), internal error messages are suppressed in favor of a generic message, while full details are still logged server-side via `console.error`.
- If a database write fails after an image has already been uploaded, the controller deletes the orphaned file from disk to prevent storage leaks.

## Performance Optimizations

- **Connection pooling** — `mysql2` maintains a pool of up to 10 reusable connections instead of opening one per request.
- **Prepared statement reuse** — parameterized queries avoid repeated SQL parsing overhead and are safe under concurrent load.
- **Static asset serving** — the frontend and uploaded images are served directly by Express's `static` middleware, avoiding per-request application logic for file delivery.
- **Bounded request bodies** — JSON/URL-encoded payloads are capped at 1 MB and uploads at `UPLOAD_MAX_SIZE_MB`, preventing large-payload resource exhaustion.
- **Client-side inference** — hand-landmark detection runs in-browser via MediaPipe's WASM/WebGL backend, keeping the server free of any video or ML processing load.

## Troubleshooting

<details>
<summary><strong>MySQL connection issues</strong></summary>

- Confirm MySQL is running and reachable at the host/port in `.env`.
- Verify `DB_USER` / `DB_PASSWORD` match a valid MySQL account with access to `DB_NAME`.
- Re-run `mysql -u root -p < init.sql` if the `puzzlecam` database or `puzzles` table doesn't exist.
- Check the server log on startup — connection failures are logged with `[DB] Cannot connect to MySQL:` and the process exits immediately rather than serving with a broken database.

</details>

<details>
<summary><strong>Camera permission issues</strong></summary>

- Camera access requires a **secure context** — `http://localhost` is allowed, but access will be blocked on a plain `http://` origin over the network.
- Check the browser's site settings if the permission prompt was previously dismissed or denied.
- Close other applications (e.g., video conferencing tools) that may be holding an exclusive lock on the webcam.

</details>

<details>
<summary><strong>MediaPipe loading failures</strong></summary>

- The HandLandmarker model (~10 MB) loads from `storage.googleapis.com`, and its WASM runtime from `cdn.jsdelivr.net`. Both must be reachable — corporate firewalls or ad blockers can block them.
- Check the browser console for network errors on first load; a failed model fetch will prevent gesture detection from starting.
- Reload the page after confirming network access; the model is cached by the browser after a successful first load.

</details>

<details>
<summary><strong>Missing uploads</strong></summary>

- Uploaded images are written to `server/uploads/`, which is created automatically at startup if missing.
- This directory is gitignored — it will not exist after a fresh clone until the server has been started at least once.
- If an image referenced by `GET /api/puzzles` returns `404`, confirm the file wasn't manually deleted from `server/uploads/` without also clearing the corresponding database row.

</details>

<details>
<summary><strong>Environment variable configuration</strong></summary>

- Ensure `.env` exists at the project root (copied from `.env.example`) — the app will not start correctly with missing values.
- Numeric variables (`PORT`, `DB_PORT`, `UPLOAD_MAX_SIZE_MB`) must parse as valid numbers; invalid values fall back to their defaults.
- After editing `.env`, restart the server (`npm run dev` picks up changes only on restart, not automatically).

</details>

## Deployment Notes

- Set `NODE_ENV=production` to suppress internal error details from API responses.
- Run the app with `npm start` (plain `node`, no file-watching overhead) behind a process manager such as PM2 or a container orchestrator, so it restarts automatically on crash.
- Provision a dedicated, network-reachable MySQL instance and point `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD` at it — do not reuse local development credentials.
- Ensure the deployment environment allows outbound HTTPS access to `storage.googleapis.com` and `cdn.jsdelivr.net`, or hand tracking will fail to initialize client-side.
- Mount or persist `server/uploads/` to durable storage; on ephemeral filesystems (e.g., some container platforms), uploaded images will be lost on redeploy unless backed by a volume or object storage.
- Serve the app behind HTTPS/TLS in production — camera access requires a secure context in the browser.

## Future Improvements

- Move uploaded images to object storage (e.g., S3-compatible storage) instead of local disk.
- Add authentication so puzzle records can be scoped to individual users rather than a global gallery.
- Add pagination to `GET /api/puzzles` for large galleries.
- Add automated tests (unit tests for services/controllers, integration tests for the API, and browser tests for gesture flows).
- Support configurable puzzle grid sizes beyond the fixed 3×3 layout.
- Add a Content-Security-Policy that explicitly allowlists the MediaPipe CDN/model origins instead of disabling CSP outright.

## Credits

- [MediaPipe HandLandmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) — real-time hand-landmark detection powering all gesture controls.
- [Express](https://expressjs.com/) — HTTP server and routing.
- [mysql2](https://github.com/sidorares/node-mysql2) — MySQL driver with Promise and prepared-statement support.
- [Multer](https://github.com/expressjs/multer) — multipart/form-data and file upload handling.
- [Helmet](https://helmetjs.github.io/) — HTTP security headers.
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) — request rate limiting.
- [Nodemon](https://nodemon.io/) — development auto-restart tooling.

## License

No license file is currently included in this repository. All rights are reserved by default until a license is added. If you intend to open-source this project, consider adding an [MIT License](https://choosealicense.com/licenses/mit/) or another OSI-approved license.
