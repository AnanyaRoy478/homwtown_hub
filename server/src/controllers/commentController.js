const Comment = require('../models/Comment');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { clampInt, cleanStr } = require('../utils/helpers');
const { notify } = require('../utils/notify');
const { access, isMod } = require('./postController');

exports.list = asyncHandler(async (req, res) => {
  const { post } = await access(req, req.params.id);
  const page = clampInt(req.query.page, 1, 1, 1000);
  const limit = clampInt(req.query.limit, 20, 1, 50);
  const filter = { post: post._id, isRemoved: false };
  const [items, total] = await Promise.all([
    Comment.find(filter).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).populate('author', 'name avatar hometown'),
    Comment.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

exports.create = asyncHandler(async (req, res) => {
  const { post } = await access(req, req.params.id);
  const content = cleanStr(req.body.content, 1000);
  if (!content) throw httpError(400, 'Write a comment first');
  const comment = await Comment.create({ post: post._id, author: req.user._id, content });
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
  if (String(post.author) !== String(req.user._id)) {
    notify([post.author], { type: 'comment', message: `${req.user.name} commented on your post`, link: `/posts/${post._id}` });
  }
  await comment.populate('author', 'name avatar hometown');
  res.status(201).json(comment);
});

exports.remove = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({ _id: req.params.commentId, isRemoved: false });
  if (!comment) throw httpError(404, 'Comment not found');
  const { role } = await access(req, comment.post);
  const own = String(comment.author) === String(req.user._id);
  if (!own && !isMod(role)) throw httpError(403, "You can't delete this comment");
  comment.isRemoved = true;
  await comment.save();
  await Post.updateOne({ _id: comment.post }, { $inc: { commentCount: -1 } });
  if (!own) notify([comment.author], { type: 'moderation', message: 'A moderator removed one of your comments' });
  res.json({ message: 'Comment deleted' });
});
