const router = require('express').Router();
const upload = require('../middleware/upload');
const Category = require('../models/Category');
const report = require('../controllers/reportController');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { protect } = require('../middleware/auth');

// Image upload -> returns a relative URL such as /uploads/abc.jpg
// NOTE: local disk storage is fine for a single server. For multi-instance
// deployments swap this for S3 / Cloudinary.
router.post('/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) throw httpError(400, 'Choose an image to upload');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

router.post('/reports', protect, report.create);
router.get('/categories', protect, asyncHandler(async (req, res) => res.json(await Category.find().sort({ name: 1 }).lean())));

module.exports = router;
