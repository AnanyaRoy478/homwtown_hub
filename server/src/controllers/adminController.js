const User = require('../models/User');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Event = require('../models/Event');
const Report = require('../models/Report');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { escapeRegex, clampInt, cleanStr } = require('../utils/helpers');
const { notify } = require('../utils/notify');

const DAY = 24 * 3600 * 1000;
const pct = (n) => Math.round(n * 10) / 10;

exports.stats = asyncHandler(async (req, res) => {
  const now = Date.now();
  const d = (ms) => new Date(now - ms);
  const [users, communities, pendingCommunities, posts, postsToday, events, openReports, dau, wau, new30, prev30, newUsers7, engagement, participation, top, rUsers, rComms, rPosts] =
    await Promise.all([
      User.countDocuments(),
      Community.countDocuments({ status: 'approved' }),
      Community.countDocuments({ status: 'pending' }),
      Post.countDocuments({ isRemoved: false }),
      Post.countDocuments({ isRemoved: false, createdAt: { $gte: d(DAY) } }),
      Event.countDocuments(),
      Report.countDocuments({ status: 'open' }),
      User.countDocuments({ lastActiveAt: { $gte: d(DAY) } }),
      User.countDocuments({ lastActiveAt: { $gte: d(7 * DAY) } }),
      Community.countDocuments({ status: 'approved', createdAt: { $gte: d(30 * DAY) } }),
      Community.countDocuments({ status: 'approved', createdAt: { $gte: d(60 * DAY), $lt: d(30 * DAY) } }),
      User.countDocuments({ createdAt: { $gte: d(7 * DAY) } }),
      Post.aggregate([
        { $match: { isRemoved: false } },
        { $group: { _id: null, likes: { $sum: { $size: '$likes' } }, comments: { $sum: '$commentCount' }, shares: { $sum: '$shareCount' } } },
      ]),
      Event.aggregate([
        { $lookup: { from: 'communities', localField: 'community', foreignField: '_id', as: 'c' } },
        { $unwind: '$c' },
        { $group: { _id: null, rsvps: { $sum: { $size: '$attendees' } }, reach: { $sum: '$c.memberCount' } } },
      ]),
      Community.find({ status: 'approved' }).sort({ memberCount: -1 }).limit(5).select('name city memberCount').lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name createdAt').lean(),
      Community.find().sort({ createdAt: -1 }).limit(5).select('name city status createdAt').lean(),
      Post.find({ isRemoved: false }).sort({ createdAt: -1 }).limit(5).populate('author', 'name').populate('community', 'name').lean(),
    ]);

  const eng = engagement[0] || { likes: 0, comments: 0, shares: 0 };
  const part = participation[0] || { rsvps: 0, reach: 0 };
  const recent = [
    ...rUsers.map((u) => ({ kind: 'user', text: `${u.name} joined the platform`, at: u.createdAt })),
    ...rComms.map((c) => ({ kind: 'community', text: `${c.name} (${c.city}) was created: ${c.status}`, at: c.createdAt })),
    ...rPosts.map((p) => ({ kind: 'post', text: `${p.author?.name || 'Someone'} posted in ${p.community?.name || 'a community'}`, at: p.createdAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 10);

  res.json({
    totals: { users, communities, pendingCommunities, posts, events, openReports },
    kpis: {
      registeredUsers: users,
      activeCommunities: communities,
      dau,
      wau,
      postsToday,
      newUsers7d: newUsers7,
      engagementPerPost: posts ? pct((eng.likes + eng.comments + eng.shares) / posts) : 0,
      eventParticipationRate: part.reach ? pct((part.rsvps / part.reach) * 100) : 0,
      communityGrowthRate: prev30 ? pct(((new30 - prev30) / prev30) * 100) : new30 ? 100 : 0,
    },
    topCommunities: top,
    recent,
  });
});

// ---- Communities ----
exports.communities = asyncHandler(async (req, res) => {
  const filter = {};
  if (['pending', 'approved', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) filter.name = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
  const items = await Community.find(filter).sort({ createdAt: -1 }).limit(100).populate('createdBy', 'name email').lean();
  res.json(items);
});

exports.setCommunityStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) throw httpError(400, 'Invalid status');
  const c = await Community.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!c) throw httpError(404, 'Community not found');
  notify([c.createdBy], {
    type: 'community_status',
    message: status === 'approved' ? `${c.name} is approved and live` : `${c.name} was ${status}`,
    link: `/communities/${c._id}`,
  });
  res.json(c);
});

// ---- Users & moderators ----
exports.users = asyncHandler(async (req, res) => {
  const page = clampInt(req.query.page, 1, 1, 1000);
  const limit = clampInt(req.query.limit, 20, 1, 100);
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (['user', 'admin'].includes(req.query.role)) filter.role = req.query.role;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { role, isBanned } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  if (String(user._id) === String(req.user._id)) throw httpError(400, "You can't change your own role or suspend yourself");
  if (role !== undefined) {
    if (!['user', 'admin'].includes(role)) throw httpError(400, 'Invalid role');
    user.role = role;
  }
  if (typeof isBanned === 'boolean') user.isBanned = isBanned;
  await user.save();
  res.json(user);
});

exports.moderators = asyncHandler(async (req, res) => {
  const ms = await Membership.find({ role: { $in: ['moderator', 'admin'] }, status: 'active' })
    .populate('user', 'name email')
    .populate('community', 'name city')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(ms.filter((m) => m.user && m.community));
});

// ---- Reports ----
exports.reports = asyncHandler(async (req, res) => {
  const filter = {};
  if (['open', 'resolved', 'dismissed'].includes(req.query.status)) filter.status = req.query.status;
  const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(100).populate('reporter', 'name').lean();

  await Promise.all(
    reports.map(async (r) => {
      try {
        if (r.targetType === 'post') {
          const p = await Post.findById(r.targetId).populate('author', 'name').lean();
          r.preview = p ? { text: p.content.slice(0, 200), by: p.author?.name, removed: p.isRemoved, link: `/posts/${p._id}` } : null;
        } else if (r.targetType === 'comment') {
          const c = await Comment.findById(r.targetId).populate('author', 'name').lean();
          r.preview = c ? { text: c.content.slice(0, 200), by: c.author?.name, removed: c.isRemoved } : null;
        } else if (r.targetType === 'user') {
          const u = await User.findById(r.targetId).select('name email isBanned').lean();
          r.preview = u ? { text: `${u.name} (${u.email})`, removed: u.isBanned } : null;
        } else {
          const c = await Community.findById(r.targetId).select('name city').lean();
          r.preview = c ? { text: `${c.name}, ${c.city}`, link: `/communities/${c._id}` } : null;
        }
      } catch { r.preview = null; }
    })
  );
  res.json(reports);
});

exports.resolveReport = asyncHandler(async (req, res) => {
  const { status, note, action } = req.body; // action: remove_content | ban_user | none
  if (!['resolved', 'dismissed'].includes(status)) throw httpError(400, 'Status must be resolved or dismissed');
  const report = await Report.findById(req.params.id);
  if (!report) throw httpError(404, 'Report not found');

  if (status === 'resolved') {
    if (action === 'remove_content') {
      if (report.targetType === 'post') await Post.updateOne({ _id: report.targetId }, { isRemoved: true, pinned: false });
      else if (report.targetType === 'comment') {
        const c = await Comment.findOneAndUpdate({ _id: report.targetId, isRemoved: false }, { isRemoved: true });
        if (c) await Post.updateOne({ _id: c.post }, { $inc: { commentCount: -1 } });
      } else throw httpError(400, 'Only posts and comments can be removed');
    } else if (action === 'ban_user') {
      let userId = report.targetType === 'user' ? report.targetId : null;
      if (report.targetType === 'post') userId = (await Post.findById(report.targetId))?.author;
      if (report.targetType === 'comment') userId = (await Comment.findById(report.targetId))?.author;
      if (!userId) throw httpError(400, 'No user to suspend for this report');
      if (String(userId) === String(req.user._id)) throw httpError(400, "You can't suspend yourself");
      await User.updateOne({ _id: userId }, { isBanned: true });
    }
  }
  report.status = status;
  report.resolutionNote = cleanStr(note, 500);
  report.resolvedBy = req.user._id;
  await report.save();
  notify([report.reporter], { type: 'system', message: 'Your report was reviewed. Thanks for helping keep the community safe.' });
  res.json(report);
});

// ---- Categories & tags ----
exports.listCategories = asyncHandler(async (req, res) => res.json(await Category.find().sort({ kind: 1, name: 1 }).lean()));

exports.createCategory = asyncHandler(async (req, res) => {
  const name = cleanStr(req.body.name, 40);
  if (name.length < 2) throw httpError(400, 'Enter a name (at least 2 characters)');
  const kind = req.body.kind === 'tag' ? 'tag' : 'category';
  res.status(201).json(await Category.create({ name, kind }));
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const c = await Category.findByIdAndDelete(req.params.id);
  if (!c) throw httpError(404, 'Category not found');
  res.json({ message: 'Deleted' });
});
