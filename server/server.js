require("dotenv").config();

const app = require("./app");
const { testConnection, pool } = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  // Verify database connectivity before accepting traffic
  try {
    await testConnection();
    console.log("[DB] Connected to MySQL successfully.");
  } catch (err) {
    console.error("[DB] Cannot connect to MySQL:", err.message);
    console.error("[DB] Check your .env credentials and that MySQL is running.");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] PuzzleCam running at http://localhost:${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`\n[Server] ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      try {
        await pool.end();
        console.log("[DB] Connection pool closed.");
      } catch (err) {
        console.error("[DB] Error closing pool:", err.message);
      }
      process.exit(0);
    });

    // Force exit if graceful shutdown takes more than 10 seconds
    setTimeout(() => {
      console.error("[Server] Forced exit after timeout.");
      process.exit(1);
    }, 10000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
