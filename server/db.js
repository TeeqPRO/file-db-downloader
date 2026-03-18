
// Importujemy moduł path do obsługi ścieżek plików
const path = require('path');
// Importujemy bibliotekę sqlite3 do obsługi bazy danych SQLite
const sqlite3 = require('sqlite3').verbose();


// Ustalamy ścieżkę do pliku bazy danych (db/filedb.sqlite)
const dbPath = path.resolve(__dirname, 'db', 'filedb.sqlite');
// Tworzymy połączenie z bazą danych SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    // Jeśli nie uda się połączyć, wypisz błąd
    console.error('Could not connect to database', err);
  } else {
    // Sukces: połączono z bazą
    console.log('Connected to SQLite database');
  }
});


// Funkcja normalizująca nazwę użytkownika: zamienia na małe litery, usuwa znaki specjalne
function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}


// Buduje bazową nazwę użytkownika na podstawie e-maila lub ID
function buildBaseUsername(email, fallbackId) {
  const local = String(email || '').split('@')[0] || String(fallbackId || 'user');
  const normalized = normalizeUsername(local).replace(/^_+|_+$/g, '');
  return normalized.slice(0, 24) || 'user';
}


// Funkcja zapewniająca unikalność nazw użytkowników w bazie
function ensureUniqueUsernames() {
  db.all('SELECT id, email, username FROM users ORDER BY created_at ASC, id ASC', [], (err, rows) => {
    if (err) {
      // Błąd przy pobieraniu użytkowników
      console.error('Failed to load users for username normalization', err);
      return;
    }

    const used = new Set(); // Zbiór już użytych nazw
    const updates = [];     // Lista aktualizacji

    for (const row of rows || []) {
      // Normalizujemy nazwę użytkownika
      const current = normalizeUsername(row.username).slice(0, 24);
      let base = current || buildBaseUsername(row.email, row.id);
      let candidate = base;
      let suffix = 1;

      // Jeśli nazwa jest zajęta, dodajemy sufiks
      while (!candidate || used.has(candidate)) {
        const tail = `_${String(suffix)}`;
        const maxBase = Math.max(1, 24 - tail.length);
        candidate = `${base.slice(0, maxBase)}${tail}`;
        suffix += 1;
      }

      used.add(candidate);
      if (row.username !== candidate) {
        updates.push({ id: row.id, username: candidate });
      }
    }

    // Jeśli nie ma zmian, tworzymy unikalny indeks na username
    if (updates.length === 0) {
      db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)', (indexErr) => {
        if (indexErr) {
          console.error('Failed to ensure unique index for users.username', indexErr);
        }
      });
      return;
    }

    let pending = updates.length;
    updates.forEach((update) => {
      db.run('UPDATE users SET username = ? WHERE id = ?', [update.username, update.id], (updateErr) => {
        if (updateErr) {
          console.error('Failed to normalize username for user', update.id, updateErr);
        }
        pending -= 1;
        if (pending === 0) {
          db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)', (indexErr) => {
            if (indexErr) {
              console.error('Failed to ensure unique index for users.username', indexErr);
            }
          });
        }
      });
    });
  });
}


// Create users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password TEXT NOT NULL,
  avatarPath TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

// Create files table
const createFilesTable = `
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  size TEXT,
  downloads INTEGER DEFAULT 0,
  date TEXT,
  imagePath TEXT,
  filePath TEXT,
  specPath TEXT,
  user_id TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`;

// Create downloads table
const createDownloadsTable = `
CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  file_id TEXT,
  downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(file_id) REFERENCES files(id)
);
`;

const createStarsTable = `
CREATE TABLE IF NOT EXISTS stars (
  user_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, file_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(file_id) REFERENCES files(id)
);
`;

db.serialize(() => {
  db.run(createUsersTable, (err) => {
    if (err) {
      console.error('Failed to create users table', err);
    }
  });
  db.run(createFilesTable, (err) => {
    if (err) {
      console.error('Failed to create files table', err);
    }
  });
  db.run(createDownloadsTable, (err) => {
    if (err) {
      console.error('Failed to create downloads table', err);
    }
  });
  db.run(createStarsTable, (err) => {
    if (err) {
      console.error('Failed to create stars table', err);
    }
  });

  // Backward compatibility for older DBs created before avatarPath existed.
  db.run('ALTER TABLE users ADD COLUMN avatarPath TEXT', (err) => {
    if (err && !String(err.message).includes('duplicate column name')) {
      console.error('Failed to ensure avatarPath column', err);
    }
  });

  db.run('ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP', (err) => {
    if (err && !String(err.message).includes('duplicate column name')) {
      console.error('Failed to ensure users.created_at column', err);
    }
  });

  db.run('ALTER TABLE users ADD COLUMN username TEXT', (err) => {
    const msg = String(err?.message || '');
    if (err && !msg.includes('duplicate column name')) {
      console.error('Failed to ensure users.username column', err);
    }
  });

  db.run(
    "UPDATE users SET created_at = COALESCE(created_at, datetime('now')) WHERE created_at IS NULL OR TRIM(created_at) = ''",
    (err) => {
      if (err) {
        console.error('Failed to backfill users.created_at values', err);
      }
    }
  );

  ensureUniqueUsernames();

  db.run('ALTER TABLE files ADD COLUMN user_id TEXT', (err) => {
    if (err && !String(err.message).includes('duplicate column name')) {
      console.error('Failed to ensure files.user_id column', err);
    }
  });
});

module.exports = db;
