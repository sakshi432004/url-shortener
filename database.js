const Database = require('better-sqlite3');
const shortid = require('shortid');

// Initialize database
const db = new Database('url_database.db');

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Generate unique short code
function generateShortCode() {
  return shortid.generate();
}

// Save URL to database
function saveUrl(originalUrl) {
  const shortCode = generateShortCode();
  
  const stmt = db.prepare('INSERT INTO urls (original_url, short_code) VALUES (?, ?)');
  const info = stmt.run(originalUrl, shortCode);
  
  return {
    id: info.lastInsertRowid,
    original_url: originalUrl,
    short_code: shortCode
  };
}

// Get original URL by short code
function getOriginalUrl(shortCode) {
  const stmt = db.prepare('SELECT original_url FROM urls WHERE short_code = ?');
  const result = stmt.get(shortCode);
  return result ? result.original_url : null;
}

// Get all URLs (for analytics)
function getAllUrls() {
  const stmt = db.prepare('SELECT * FROM urls ORDER BY created_at DESC');
  return stmt.all();
}

module.exports = {
  saveUrl,
  getOriginalUrl,
  getAllUrls
};
