const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

module.exports = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      const e = new Error('Only JPG, PNG, WEBP or GIF images are allowed');
      e.status = 400;
      return cb(e);
    }
    cb(null, true);
  },
});
