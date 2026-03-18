
// Importujemy wymagane biblioteki
const express = require('express'); // Framework do budowy API
const path = require('path');       // Obsługa ścieżek plików
const fs = require('fs');           // Operacje na plikach
const bcrypt = require('bcryptjs'); // Szyfrowanie haseł
const jwt = require('jsonwebtoken');// Tokeny JWT do autoryzacji
const multer = require('multer');   // Obsługa uploadu plików
const crypto = require('crypto');   // Generowanie losowych danych
const db = require('./db');         // Nasza baza danych SQLite

const app = express();
const PORT = process.env.PORT || 4000; // Port serwera
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'; // Sekret JWT

// Normalizuje e-mail (małe litery, bez spacji)
function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

// Normalizuje nazwę użytkownika (małe litery, bez spacji)
function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

// Sprawdza, czy nazwa użytkownika jest poprawna (3-24 znaki, a-z, 0-9, _)
function isValidUsername(username) {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

// Usuwa niebezpieczne znaki z nazwy pliku
function sanitizeFileName(fileName) {
  return String(fileName || '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Tworzy katalog, jeśli nie istnieje
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Wysyła błąd bazy danych jako odpowiedź
function dbError(res, err) {
  return res.status(500).json({ error: err.message });
}

// Buduje wyświetlaną nazwę użytkownika na podstawie e-maila
function buildDisplayName(email) {
  const normalized = normalizeEmail(email);
  const localPart = normalized.split('@')[0] || 'user';
  return localPart;
}

// Zwraca nazwę użytkownika lub wyświetlaną nazwę
function getDisplayName(user) {
  return user?.username || buildDisplayName(user?.email || '');
}

// Buduje URL do avatara użytkownika
function buildAvatarUrl(avatarPath) {
  return avatarPath ? `/avatars/${avatarPath}` : '/avatars/default.svg';
}

// Middleware do obsługi JSON w żądaniach
app.use(express.json());
// Udostępnia katalog z plikami do pobrania
app.use('/files', express.static(path.join(__dirname, 'files')));
// Udostępnia katalog z avatarami
app.use('/avatars', express.static(path.join(__dirname, 'avatars')));

// Konfiguracja uploadu plików do katalogu tmp
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'tmp'));
    },
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${sanitizeFileName(file.originalname)}`;
      cb(null, safeName);
    },
  }),
});

// Upewniamy się, że katalog tmp istnieje
const tmpDir = path.join(__dirname, 'tmp');
ensureDirectory(tmpDir);

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: 'No token' });
  }

  const token = header.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username and password required' });
    }

    if (!isValidUsername(normalizedUsername)) {
      return res.status(400).json({ error: 'Username must be 3-24 chars: a-z, 0-9, _' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    db.run(
      'INSERT INTO users (id, email, username, password) VALUES (?, ?, ?, ?)',
      [userId, normalizedEmail, normalizedUsername, hash],
      function (err) {
        if (err) {
          if (String(err.message || '').includes('users.username')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(400).json({ error: 'User already exists' });
        }
        const token = jwt.sign({ id: userId, email: normalizedEmail, username: normalizedUsername }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token });
      }
    );
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { login, email, username, password } = req.body;
  const rawLogin = String(login || email || username || '').trim();
  if (!rawLogin || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  const normalizedEmail = normalizeEmail(rawLogin);
  const normalizedUsername = normalizeUsername(rawLogin);

  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [normalizedEmail, normalizedUsername], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username || buildDisplayName(user.email) }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  });
});

app.get('/api/discover', (req, res) => {
  const page = Number(req.query.page || 1);
  const q = String(req.query.q || '');
  const scope = String(req.query.scope || 'files').toLowerCase() === 'users' ? 'users' : 'files';
  const limit = 30;
  const offset = (page - 1) * limit;
  let sql = '';
  let params = [];

  if (scope === 'users') {
    sql = `
      SELECT
        u.id,
        u.email,
        u.username,
        u.avatarPath,
        u.created_at,
        COUNT(DISTINCT f.id) AS uploadsCount,
        COALESCE(SUM(f.downloads), 0) AS totalDownloads,
        COALESCE(COUNT(s.file_id), 0) AS totalStarsReceived
      FROM users u
      LEFT JOIN files f ON f.user_id = u.id
      LEFT JOIN stars s ON s.file_id = f.id
    `;

    if (q) {
      sql += ' WHERE u.email LIKE ? OR u.username LIKE ?';
      params = [`%${q}%`, `%${q}%`];
    }

    sql += ' GROUP BY u.id ORDER BY totalDownloads DESC, uploadsCount DESC LIMIT ? OFFSET ?';
    params.push(limit + 1, offset);

    db.all(sql, params, (err, rows) => {
      if (err) {
        return dbError(res, err);
      }

      const hasMore = rows.length > limit;
      const items = rows.slice(0, limit).map((row) => ({
        id: row.id,
        email: row.email,
        username: row.username || buildDisplayName(row.email),
        displayName: row.username || buildDisplayName(row.email),
        avatarUrl: buildAvatarUrl(row.avatarPath),
        joinedAt: row.created_at,
        uploadsCount: Number(row.uploadsCount || 0),
        totalDownloads: Number(row.totalDownloads || 0),
        totalStarsReceived: Number(row.totalStarsReceived || 0),
      }));

      return res.json({ items, hasMore, page, scope: 'users' });
    });
    return;
  }

  sql = 'SELECT * FROM files';

  if (q) {
    sql += ' WHERE title LIKE ? OR description LIKE ?';
    params = [`%${q}%`, `%${q}%`];
  }

  sql += ' ORDER BY downloads DESC LIMIT ? OFFSET ?';
  params.push(limit + 1, offset);

  db.all(sql, params, (err, rows) => {
    if (err) {
      return dbError(res, err);
    }
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    return res.json({ items, hasMore, page, scope: 'files' });
  });
});

app.get('/api/search/suggestions', (req, res) => {
  const q = String(req.query.q || '').trim();
  const scope = String(req.query.scope || 'files').toLowerCase() === 'users' ? 'users' : 'files';
  if (!q) {
    return res.json({ items: [] });
  }

  if (scope === 'users') {
    db.all(
      'SELECT email, username FROM users WHERE email LIKE ? OR username LIKE ? ORDER BY created_at DESC LIMIT 7',
      [`%${q}%`, `%${q}%`],
      (err, rows) => {
        if (err) {
          return dbError(res, err);
        }
        return res.json({ items: rows.map((row) => row.username || row.email) });
      }
    );
    return;
  }

  db.all(
    'SELECT title FROM files WHERE title LIKE ? ORDER BY downloads DESC LIMIT 7',
    [`%${q}%`],
    (err, rows) => {
      if (err) {
        return dbError(res, err);
      }
      return res.json({ items: rows.map((row) => row.title) });
    }
  );
});

app.get('/api/me', auth, (req, res) => {
  db.get('SELECT id, email, username, avatarPath FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      username: user.username || buildDisplayName(user.email),
      displayName: getDisplayName(user),
      avatarUrl: buildAvatarUrl(user.avatarPath),
    });
  });
});

app.patch('/api/me/username', auth, (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-24 chars: a-z, 0-9, _' });
  }

  db.run('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id], function (err) {
    if (err) {
      if (String(err.message || '').includes('users.username') || String(err.message || '').includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return dbError(res, err);
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, username });
  });
});

app.patch('/api/me/password', auth, (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  db.get('SELECT id, email, username, password FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, user.id], (updateErr) => {
      if (updateErr) {
        return dbError(res, updateErr);
      }

      return res.json({ success: true });
    });
  });
});

app.post('/api/avatar', auth, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Avatar file is required' });
  }

  const ext = path.extname(req.file.originalname) || '.png';
  const avatarFileName = `${req.user.id}${ext}`;
  const avatarTargetPath = path.join(__dirname, 'avatars', avatarFileName);

  fs.renameSync(req.file.path, avatarTargetPath);

  db.run('UPDATE users SET avatarPath = ? WHERE id = ?', [avatarFileName, req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to save avatar' });
    }

    return res.json({ success: true, avatarUrl: `/avatars/${avatarFileName}` });
  });
});

app.get('/api/files', (req, res) => {
  db.all('SELECT * FROM files', [], (err, rows) => {
    if (err) {
      return dbError(res, err);
    }
    return res.json(rows);
  });
});

app.get('/api/files/:id', (req, res) => {
  db.get(
    `SELECT
      f.*,
      u.id AS uploaderId,
      u.email AS uploaderEmail,
      u.username AS uploaderUsername,
      u.avatarPath AS uploaderAvatarPath,
      u.created_at AS uploaderJoinedAt,
      (SELECT COUNT(*) FROM stars s WHERE s.file_id = f.id) AS starsCount
    FROM files f
    LEFT JOIN users u ON u.id = f.user_id
    WHERE f.id = ?`,
    [req.params.id],
    (err, row) => {
    if (err) {
      return dbError(res, err);
    }
    if (!row) {
      return res.status(404).json({ error: 'File not found' });
    }

      return res.json({
        ...row,
        starsCount: Number(row.starsCount || 0),
        uploader: row.uploaderId
          ? {
              id: row.uploaderId,
              email: row.uploaderEmail,
              username: row.uploaderUsername || buildDisplayName(row.uploaderEmail),
              displayName: row.uploaderUsername || buildDisplayName(row.uploaderEmail),
              avatarUrl: buildAvatarUrl(row.uploaderAvatarPath),
              joinedAt: row.uploaderJoinedAt,
            }
          : null,
      });
    }
  );
});

app.get('/api/users/:id/public', (req, res) => {
  const userId = req.params.id;

  db.get(
    `SELECT
      u.id,
      u.email,
      u.username,
      u.avatarPath,
      u.created_at,
      COUNT(DISTINCT f.id) AS uploadsCount,
      COALESCE(SUM(f.downloads), 0) AS totalDownloads,
      COALESCE(COUNT(s.file_id), 0) AS totalStarsReceived,
      MAX(f.date) AS lastUploadDate,
      COALESCE(SUM(CASE WHEN date(f.date) >= date('now', '-30 day') THEN 1 ELSE 0 END), 0) AS uploadsLast30Days
    FROM users u
    LEFT JOIN files f ON f.user_id = u.id
    LEFT JOIN stars s ON s.file_id = f.id
    WHERE u.id = ?
    GROUP BY u.id`,
    [userId],
    (err, userRow) => {
      if (err) {
        return dbError(res, err);
      }

      if (!userRow) {
        return res.status(404).json({ error: 'User not found' });
      }

      db.all(
        `SELECT
          f.*,
          (SELECT COUNT(*) FROM stars s WHERE s.file_id = f.id) AS starsCount
        FROM files f
        WHERE f.user_id = ?
        ORDER BY f.date DESC`,
        [userId],
        (uploadsErr, uploadsRows) => {
          if (uploadsErr) {
            return dbError(res, uploadsErr);
          }

          return res.json({
            user: {
              id: userRow.id,
              email: userRow.email,
              username: userRow.username || buildDisplayName(userRow.email),
              displayName: userRow.username || buildDisplayName(userRow.email),
              avatarUrl: buildAvatarUrl(userRow.avatarPath),
              joinedAt: userRow.created_at,
            },
            stats: {
              uploadsCount: Number(userRow.uploadsCount || 0),
              totalDownloads: Number(userRow.totalDownloads || 0),
              totalStarsReceived: Number(userRow.totalStarsReceived || 0),
              uploadsLast30Days: Number(userRow.uploadsLast30Days || 0),
              lastUploadDate: userRow.lastUploadDate || null,
            },
            uploads: (uploadsRows || []).map((row) => ({
              ...row,
              starsCount: Number(row.starsCount || 0),
            })),
          });
        }
      );
    }
  );
});

app.get('/api/my/files', auth, (req, res) => {
  db.all(
    'SELECT * FROM files WHERE user_id = ? ORDER BY date DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json({ items: rows });
    }
  );
});

app.get('/api/starred', auth, (req, res) => {
  db.all(
    `SELECT f.*
     FROM stars s
     JOIN files f ON f.id = s.file_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json({ items: rows });
    }
  );
});

app.get('/api/starred/ids', auth, (req, res) => {
  db.all('SELECT file_id FROM stars WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ items: rows.map((row) => row.file_id) });
  });
});

app.post('/api/stars/toggle/:id', auth, (req, res) => {
  const fileId = req.params.id;
  db.get('SELECT * FROM stars WHERE user_id = ? AND file_id = ?', [req.user.id, fileId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      db.run('DELETE FROM stars WHERE user_id = ? AND file_id = ?', [req.user.id, fileId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }
        return res.json({ success: true, starred: false });
      });
      return;
    }

    db.run('INSERT INTO stars (user_id, file_id) VALUES (?, ?)', [req.user.id, fileId], (insertErr) => {
      if (insertErr) {
        return res.status(500).json({ error: insertErr.message });
      }
      return res.json({ success: true, starred: true });
    });
  });
});

app.patch('/api/files/:id', auth, (req, res) => {
  const { title, description } = req.body;
  db.run(
    'UPDATE files SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ? AND user_id = ?',
    [title ?? null, description ?? null, req.params.id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'File not found or no permission' });
      }
      return res.json({ success: true });
    }
  );
});

app.delete('/api/files/:id', auth, (req, res) => {
  db.get('SELECT * FROM files WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'File not found or no permission' });
    }

    const folderPath = path.join(__dirname, 'files', row.id);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    db.run('DELETE FROM stars WHERE file_id = ?', [row.id]);
    db.run('DELETE FROM files WHERE id = ? AND user_id = ?', [row.id, req.user.id], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr.message });
      }
      return res.json({ success: true });
    });
  });
});

app.post('/api/upload', auth, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), (req, res) => {
  const uploadedFile = req.files?.file?.[0];
  const uploadedImage = req.files?.image?.[0];
  const { title, description } = req.body;

  if (!title || !uploadedFile || !uploadedImage) {
    return res.status(400).json({ error: 'title, file and image are required' });
  }

  const fileId = crypto.randomUUID();
  const folderPath = path.join(__dirname, 'files', fileId);
  ensureDirectory(folderPath);

  const safeFileName = sanitizeFileName(uploadedFile.originalname);
  const safeImageName = sanitizeFileName(uploadedImage.originalname);
  const finalFilePath = path.join(folderPath, safeFileName);
  const finalImagePath = path.join(folderPath, safeImageName);

  fs.renameSync(uploadedFile.path, finalFilePath);
  fs.renameSync(uploadedImage.path, finalImagePath);

  const sizeMb = (uploadedFile.size / (1024 * 1024)).toFixed(2);
  const date = new Date().toISOString().slice(0, 10);
  const spec = {
    title,
    description: description || '',
    size: `${sizeMb} MB`,
    downloads: 0,
    date,
    image: safeImageName,
    file: safeFileName,
  };

  fs.writeFileSync(path.join(folderPath, 'spec.json'), JSON.stringify(spec, null, 2));

  db.run(
    'INSERT INTO files (id, title, description, size, downloads, date, imagePath, filePath, specPath, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      fileId,
      title,
      description || '',
      `${sizeMb} MB`,
      0,
      date,
      `${fileId}/${safeImageName}`,
      safeFileName,
      `${fileId}/spec.json`,
      req.user.id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save file metadata' });
      }

      return res.json({ success: true, id: fileId });
    }
  );
});

app.get('/api/files/:id/download', (req, res) => {
  db.get('SELECT * FROM files WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fullPath = path.join(__dirname, 'files', row.id, row.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    db.run('UPDATE files SET downloads = downloads + 1 WHERE id = ?', [row.id]);
    return res.download(fullPath, row.filePath);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
