const fs = require('fs');
const path = require('path');

const root = __dirname;
const dbFile = path.join(root, 'db', 'filedb.sqlite');
const filesDir = path.join(root, 'files');
const avatarsDir = path.join(root, 'avatars');
const tmpDir = path.join(root, 'tmp');
const tmpTestDir = path.join(root, 'tmp-test');

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(targetPath);
  }
}

function ensureDir(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
}

function cleanDirectory(dirPath, keepNames = []) {
  ensureDir(dirPath);
  for (const name of fs.readdirSync(dirPath)) {
    if (keepNames.includes(name)) continue;
    removePath(path.join(dirPath, name));
  }
}

try {
  removePath(dbFile);
} catch (error) {
  if (error && error.code === 'EBUSY') {
    console.error('Cannot reset DB because filedb.sqlite is locked. Stop backend first, then run reset again.');
    process.exit(1);
  }
  throw error;
}
cleanDirectory(filesDir);
cleanDirectory(avatarsDir, ['default.svg']);
cleanDirectory(tmpDir);
removePath(tmpTestDir);

console.log('Database reset complete.');
console.log('- Removed SQLite file:', dbFile);
console.log('- Cleaned uploads directory:', filesDir);
console.log('- Cleaned avatars (kept default.svg):', avatarsDir);
console.log('- Cleaned tmp directories.');
