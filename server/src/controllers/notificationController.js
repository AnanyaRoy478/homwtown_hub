const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { clampInt } = require('../utils/helpers');

exports.list = asyncHandler(async (req, res) => {
  const limit = clampInt(req.query.limit, 30, 1, 100);
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, unread });
});

exports.unreadCount = asyncHandler(async (req, res) => {
  res.json({ unread: await Notification.countDocuments({ user: req.user._id, read: false }) });
});

exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!n) throw httpError(404, 'Notification not found');
  res.json(n);
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All caught up' });
});
