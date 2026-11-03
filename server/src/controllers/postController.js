const Post = require('../models/Post');
const Membership = require('../models/Membership');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { clampInt, cleanStr, cleanImages, cleanTags } = require('../utils/helpers');
const { notify, notifyCommunity } = require('../utils/notify');

const isMod = (role) => role === 'moderator' || role === 'admin';
const AUTHOR = { path: 'author', select: 'name avatar hometown' };
const COMMUNITY = { path: 'community', select: 'name city' };

const shape = (p, uid, myRole) => {
  const o = p.toObject ? p.toObject() : { ...p };
  o.likeCount = (o.likes || []).length;
  o.liked = (o.likes || []).some((l) => String(l) === String(uid));
  delete o.likes;
  if (myRole) o.myRole = myRole;
  return o;
};

// Loads a post and confirms the caller may see it. Returns { post, role }.
const access = async (req, postId) => {
  const post = await Post.findOne({ _id: postId, isRemoved: false });
  if (!post) throw httpError(404, 'Post not found');
  if (req.user.role === 'admin') return { post, role: 'admin' };
  const m = await Membership.findOne({ user: req.user._id, community: post.community, status: 'active' });
  if (!m) throw httpError(403, 'Join this community to see its posts');
  return { post, role: m.role };
};
exports.access = access;
exports.isMod = isMod;

exports.feed = asyncHandler(async (req, res) => {
  const page = clampInt(req.query.page, 1, 1, 1000);
  const limit = clampInt(req.query.limit, 10, 1, 30);
  const ms = await Membership.find({ user: req.user._id, status: 'active' }).lean();
  const roles = Object.fromEntries(ms.map((m) => [String(m.community), m.role]));
  const filter = { community: { $in: ms.map((m) => m.community) }, isRemoved: false };
  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(AUTHOR).populate(COMMUNITY),
    Post.countDocuments(filter),
  ]);
  res.json({ items: posts.map((p) => shape(p, req.user._id, roles[String(p.community?._id)])), total, page, pages: Math.ceil(total / limit) });
});

exports.listByCommunity = asyncHandler(async (req, res) => {
  const page = clampInt(req.query.page, 1, 1, 1000);
  const limit = clampInt(req.query.limit, 10, 1, 30);
  const filter = { community: req.community._id, isRemoved: false };
  if (req.query.type && ['post', 'announcement', 'discussion'].includes(req.query.type)) filter.type = req.query.type;
  if (req.query.category) filter.category = String(req.query.category).slice(0, 40);
  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ pinned: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(AUTHOR).populate(COMMUNITY),
    Post.countDocuments(filter),
  ]);
  res.json({ items: posts.map((p) => shape(p, req.user._id, req.membership.role)), total, page, pages: Math.ceil(total / limit) });
});

exports.create = asyncHandler(async (req, res) => {
  const { content, title, type = 'post', images, tags, category } = req.body;
  if (!['post', 'announcement', 'discussion'].includes(type)) throw httpError(400, 'Invalid post type');
  if (typeof content !== 'string' || !content.trim()) throw httpError(400, 'Write something before posting');
  if (content.length > 5000) throw httpError(400, 'Posts can be up to 5000 characters');
  if (type === 'announcement' && !isMod(req.membership.role)) throw httpError(403, 'Only moderators can post announcements');
  if (req.community.status !== 'approved') throw httpError(400, 'This community is still waiting for platform approval');

  const post = await Post.create({
    community: req.community._id,
    author: req.user._id,
    type,
    title: cleanStr(title, 150),
    content: content.trim(),
    images: cleanImages(images),
    tags: cleanTags(tags),
    category: cleanStr(category, 40),
  });
  if (type === 'announcement') {
    notifyCommunity(req.community._id, req.user._id, {
      type: 'announcement',
      message: `New announcement in ${req.community.name}${post.title ? `: ${post.title}` : ''}`,
      link: `/posts/${post._id}`,
    });
  }
  await post.populate([AUTHOR, COMMUNITY]);
  res.status(201).json(shape(post, req.user._id, req.membership.role));
});

exports.getOne = asyncHandler(async (req, res) => {
  const { post, role } = await access(req, req.params.id);
  await post.populate([AUTHOR, COMMUNITY]);
  res.json(shape(post, req.user._id, role));
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const { post } = await access(req, req.params.id);
  const liked = post.likes.some((l) => String(l) === String(req.user._id));
  await Post.updateOne({ _id: post._id }, liked ? { $pull: { likes: req.user._id } } : { $addToSet: { likes: req.user._id } });
  if (!liked && String(post.author) !== String(req.user._id)) {
    notify([post.author], { type: 'like', message: `${req.user.name} liked your post`, link: `/posts/${post._id}` });
  }
  res.json({ liked: !liked, likeCount: post.likes.length + (liked ? -1 : 1) });
});

exports.share = asyncHandler(async (req, res) => {
  const { post } = await access(req, req.params.id);
  await Post.updateOne({ _id: post._id }, { $inc: { shareCount: 1 } });
  const base = (process.env.CLIENT_URL || '').split(',')[0];
  res.json({ shareCount: post.shareCount + 1, url: `${base}/posts/${post._id}` });
});

exports.togglePin = asyncHandler(async (req, res) => {
  const { post, role } = await access(req, req.params.id);
  if (!isMod(role)) throw httpError(403, 'Only moderators can pin posts');
  post.pinned = !post.pinned;
  await post.save();
  res.json({ pinned: post.pinned });
});

exports.remove = asyncHandler(async (req, res) => {
  const { post, role } = await access(req, req.params.id);
  const own = String(post.author) === String(req.user._id);
  if (!own && !isMod(role)) throw httpError(403, "You can't delete this post");
  post.isRemoved = true;
  post.pinned = false;
  await post.save();
  if (!own) notify([post.author], { type: 'moderation', message: 'A moderator removed one of your posts' });
  res.json({ message: 'Post deleted' });
});
