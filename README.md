# Puzzle Cam 🖐️📸

A browser-based photobooth that turns a hand gesture into a sliding jigsaw puzzle. Frame a shot with your fingers, watch it capture automatically, then solve the puzzle using pinch-and-drag gestures — no mouse, no keyboard, no buttons.

Built with [MediaPipe HandLandmarker](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) for real-time hand tracking, rendered entirely on an HTML5 canvas.

## How it works

1. **Frame it** — hold both hands up and pinch (thumb + index finger) with both hands at once. The rectangle between your two index fingers becomes the photo frame.
2. **Hold** — keep both hands pinching for a quarter second to lock in the frame.
3. **Countdown** — a 3-second countdown plays over a black-and-white preview.
4. **Capture** — the frame is captured, cropped, and run through a grainy "photobooth" filter (grayscale, contrast, noise).
5. **Solve** — the photo is sliced into a 3×3 puzzle and shuffled. Pinch a piece to grab it, drag it to its spot, and let go to drop it.
6. **Save** — once every piece is placed, close your hand into a fist and hold it. The completed photo shatters apart and uploads to your gallery.

Repeat up to 3 times per session — completed puzzles appear as Polaroid-style prints in the sidebar, which you can download as a single strip or reset entirely.

## Features

- Real-time two-hand tracking (pinch-to-drag, fist-to-save)
- Automatic photo framing and capture — no shutter button
- Vintage photobooth image effect (grayscale + contrast + film grain)
- Animated piece-displacement when dropping onto an occupied cell
- "Shatter" completion animation
- Persistent gallery backed by a REST API (`/api/puzzles`)
- Downloadable photo strip (all captures stitched into one PNG)
- GPU-accelerated hand tracking with automatic CPU fallback

## Getting started

### Prerequisites

- A modern browser with webcam access (Chrome, Edge, or Firefox recommended)
- A backend serving `/api/puzzles` (GET / POST / DELETE) if you want photos to persist across sessions — without one, the app still works and falls back to a local-only gallery

### Running locally

```bash
# from the project root
npx serve .
# or any static file server, since this is plain HTML/CSS/JS
```

Open the served URL in your browser and allow camera access when prompted.

### Project structure

```
.
├── index.html          # app shell and DOM structure
├── css/
│   └── styles.css       # all styling (dark stage + light gallery sidebar)
└── app.js               # camera, hand tracking, puzzle logic, backend calls
```

## Gestures

| Gesture | Effect |
|---|---|
| Both hands pinching, held | Frames and captures a photo |
| One hand pinching over a piece | Grabs and drags that piece |
| Release pinch | Drops the piece (snaps if close to its correct cell) |
| Closed fist, held | Saves the puzzle (if solved) or resets it |

## Backend API contract

The frontend expects a simple REST API:

- `GET /api/puzzles` → `{ puzzles: [{ id, image_url, score, ... }] }`
- `POST /api/puzzles` (multipart form: `image`, `playerName`, `completionTimeSeconds`, `movesCount`, `score`) → `{ success: true, puzzle: { id, score, ... } }`
- `DELETE /api/puzzles` → clears all saved puzzles

If the backend is unreachable, captured puzzles still display locally for the current session but won't persist after a page reload.

## Configuration

Key tunable constants live at the top of `app.js`:

| Constant | Default | Purpose |
|---|---|---|
| `PINCH_THRESHOLD` | `0.055` | How close thumb + index must be to register a pinch |
| `FREEZE_HOLD_MS` | `250` | How long to hold a pinch before the countdown starts |
| `COUNTDOWN_SECONDS` | `3` | Countdown length before capture |
| `FIST_HOLD_FRAMES` | `12` | Consecutive frames a fist must be held to trigger save/reset |
| `SNAP_DISTANCE_RATIO` | `0.45` | How close a dropped piece must be to its cell to snap |
| `GRID` | `3` | Puzzle grid size (3 = 3×3 = 9 pieces) |
| `STRIP_MAX_PHOTOS` | `3` | Max photos per gallery/session |

## Browser support notes

- Requires `getUserMedia` (webcam) and WebAssembly support.
- Hand tracking prefers GPU delegation for performance; it automatically retries on CPU if GPU initialization fails.
- Camera permission denial and missing-webcam errors are surfaced in the UI with a retry option.


