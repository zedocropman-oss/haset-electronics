// db/database.js — SQLite database setup for HASET ELECTRONICS
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'haset_registrations.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // better concurrent performance
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      phone       TEXT    NOT NULL,
      email       TEXT    DEFAULT '',
      city        TEXT    DEFAULT '',
      services    TEXT    NOT NULL,   -- comma-separated list
      notes       TEXT    DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      status      TEXT    NOT NULL DEFAULT 'new'  -- new | contacted | done
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      phone       TEXT    DEFAULT '',
      email       TEXT    DEFAULT '',
      message     TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      read        INTEGER NOT NULL DEFAULT 0
    );
  `);
}

module.exports = { getDb };
