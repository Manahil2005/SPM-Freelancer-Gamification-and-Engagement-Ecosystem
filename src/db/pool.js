// =============================================================
// src/db/pool.js
// PostgreSQL connection pool using the `pg` library.
// =============================================================
// When USE_DUMMY_DB=true in .env, this pool is NOT used and
// each service directly reads from dummyData.js instead.
// When USE_DUMMY_DB=false, this pool is passed to every query.
// =============================================================
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || "gamification_db",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "",
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

module.exports = pool;
