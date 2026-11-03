const Community = require('../models/Community');
const Membership = require('../models/Membership');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { escapeRegex, clampInt, cleanStr } = require('../utils/helpers');
const { notify, notifyStaff } = require('../utils/notify');
const { RANK } = require('../middleware/auth');

const POPULATE_CREATOR = { path: 'createdBy', select: 'name avatar' };

exports.list = asyncHandler(async (req, res) => {
  const page = clampInt(req.query.page, 1, 1, 1000);
  const limit = clampInt(req.query.limit, 12, 1, 50);
  const filter = { status: 'approved' };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { city: rx }, { state: rx }];
  }
  if (req.query.type && ['city', 'town', 'village'].includes(req.query.type)) filter.type = req.query.type;

  const [items, total] = await Promise.all([
    Community.find(filter).sort({ memberCount: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Community.countDocuments(filter),
  ]);
  const ms = await Membership.find({ user: req.user._id, community: { $in: items.map((c) => c._id) } }).lean();
  const byCommunity = Object.fromEntries(ms.map((m) => [String(m.community), m]));
  items.forEach((c) => {
    const m = byCommunity[String(c._id)];
    c.myMembership = m ? { role: m.role, status: m.status } : null;
  });
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, type = 'city', city, state, description, rules, joinPolicy = 'approval', coverImage } = req.body;
  if (cleanStr(name, 100).length < 3) throw httpError(400, 'Community name must be at least 3 characters');
  if (!cleanStr(city, 80)) throw httpError(400, 'Enter the city or village this community is for');
  if (cleanStr(description, 1000).length < 10) throw httpError(400, 'Add a short description (at least 10 characters)');
  if (!['city', 'town', 'village'].includes(type)) throw httpError(400, 'Invalid community type');

  const community = await Community.create({
    name: cleanStr(name, 100),
    type,
    city: cleanStr(city, 80),
    state: cleanStr(state, 80),
    description: cleanStr(description, 1000),
    rules: cleanStr(rules, 3000),
    joinPolicy: joinPolicy === 'open' ? 'open' : 'approval',
    coverImage: typeof coverImage === 'string' && coverImage.startsWith('/uploads/') ? coverImage : undefined,
    createdBy: req.user._id,
    memberCount: 1,
  });
  await Membership.create({ user: req.user._id, community: community._id, role: 'admin', status: 'active' });
  res.status(201).json(community);
});

exports.mine = asyncHandler(async (req, res) => {
  const ms = await Membership.find({ user: req.user._id }).populate('community').sort({ createdAt: -1 }).lean();
  res.json(
    ms
      .filter((m) => m.community)
      .map((m) => ({ ...m.community, myMembership: { role: m.role, status: m.status } }))
  );
});

exports.getOne = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.communityId).populate(POPULATE_CREATOR).lean();
  if (!community) throw httpError(404, 'Community not found');
  const m = await Membership.findOne({ user: req.user._id, community: community._id }).lean();
  const isPlatformAdmin = req.user.role === 'admin';
  // Unapproved communities are only visible to their creator/staff and platform admins.
  if (community.status !== 'approved' && !isPlatformAdmin && !(m && m.status === 'active')) {
    throw httpError(404, 'Community not found');
  }
  community.myMembership = m ? { role: m.role, status: m.status } : isPlatformAdmin ? { role: 'admin', status: 'active', platform: true } : null;
  res.json(community);
});

exports.update = asyncHandler(async (req, res) => {
  const c = req.community;
  const { description, rules, coverImage, joinPolicy } = req.body;
  if (description !== undefined) {
    if (cleanStr(description, 1000).length < 10) throw httpError(400, 'Description must be at least 10 characters');
    c.description = cleanStr(description, 1000);
  }
  if (rules !== undefined) c.rules = cleanStr(rules, 3000);
  if (typeof coverImage === 'string' && coverImage.startsWith('/uploads/')) c.coverImage = coverImage;
  if (joinPolicy && RANK[req.membership.role] >= RANK.admin && ['open', 'approval'].includes(joinPolicy)) c.joinPolicy = joinPolicy;
  await c.save();
  res.json(c);
});

exports.join = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.communityId);
  if (!community || community.status !== 'approved') throw httpError(404, 'Community not found');

  let m = await Membership.findOne({ user: req.user._id, community: community._id });
  if (m && m.status === 'active') throw httpError(400, 'You are already a member');
  if (m && m.status === 'pending') throw httpError(400, 'Your request is already waiting for approval');

  const status = community.joinPolicy === 'open' ? 'active' : 'pending';
  if (m) { m.status = status; m.role = 'member'; await m.save(); }
  else m = await Membership.create({ user: req.user._id, community: community._id, role: 'member', status });

  if (status === 'active') {
    await Community.updateOne({ _id: community._id }, { $inc: { memberCount: 1 } });
  } else {
    notifyStaff(community._id, req.user._id, {
      type: 'join_request',
      message: `${req.user.name} asked to join ${community.name}`,
      link: `/communities/${community._id}?tab=manage`,
    });
  }
  res.status(201).json({ role: m.role, status: m.status });
});

exports.leave = asyncHandler(async (req, res) => {
  const m = await Membership.findOne({ user: req.user._id, community: req.params.communityId });
  if (!m) throw httpError(404, 'You are not part of this community');
  if (m.role === 'admin') {
    const others = await Membership.countDocuments({ community: m.community, role: 'admin', status: 'active', _id: { $ne: m._id } });
    if (!others) throw httpError(400, 'Make another member an admin before you leave');
  }
  await m.deleteOne();
  if (m.status === 'active') await Community.updateOne({ _id: m.community }, { $inc: { memberCount: -1 } });
  res.json({ message: 'You left the community' });
});

exports.members = asyncHandler(async (req, res) => {
  const ms = await Membership.find({ community: req.community._id, status: 'active' })
    .populate('user', 'name avatar hometown currentCity')
    .sort({ role: 1, createdAt: 1 })
    .limit(500)
    .lean();
  const order = { admin: 0, moderator: 1, member: 2 };
  ms.sort((a, b) => order[a.role] - order[b.role]);
  res.json(ms.filter((m) => m.user));
});

exports.requests = asyncHandler(async (req, res) => {
  const ms = await Membership.find({ community: req.community._id, status: 'pending' })
    .populate('user', 'name avatar hometown currentCity bio')
    .sort({ createdAt: 1 })
    .lean();
  res.json(ms.filter((m) => m.user));
});

exports.decide = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action)) throw httpError(400, 'Action must be approve or reject');
  const m = await Membership.findOne({ _id: req.params.membershipId, community: req.community._id, status: 'pending' });
  if (!m) throw httpError(404, 'Request not found');

  if (action === 'approve') {
    m.status = 'active';
    await Community.updateOne({ _id: req.community._id }, { $inc: { memberCount: 1 } });
  } else m.status = 'rejected';
  await m.save();

  notify([m.user], {
    type: action === 'approve' ? 'join_approved' : 'join_rejected',
    message: action === 'approve' ? `Welcome! You're now a member of ${req.community.name}` : `Your request to join ${req.community.name} was declined`,
    link: `/communities/${req.community._id}`,
  });
  res.json({ message: action === 'approve' ? 'Member approved' : 'Request declined' });
});

exports.setRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['member', 'moderator', 'admin'].includes(role)) throw httpError(400, 'Invalid role');
  const m = await Membership.findOne({ _id: req.params.membershipId, community: req.community._id, status: 'active' });
  if (!m) throw httpError(404, 'Member not found');
  if (String(m.user) === String(req.user._id) && role !== 'admin') {
    const others = await Membership.countDocuments({ community: m.community, role: 'admin', status: 'active', _id: { $ne: m._id } });
    if (!others) throw httpError(400, 'A community needs at least one admin');
  }
  m.role = role;
  await m.save();
  notify([m.user], { type: 'system', message: `Your role in ${req.community.name} is now ${role}`, link: `/communities/${req.community._id}` });
  res.json(m);
});

exports.removeMember = asyncHandler(async (req, res) => {
  const m = await Membership.findOne({ _id: req.params.membershipId, community: req.community._id });
  if (!m) throw httpError(404, 'Member not found');
  if (RANK[m.role] >= RANK[req.membership.role] && !req.membership.platform) throw httpError(403, "You can't remove someone with the same or higher role");
  await m.deleteOne();
  if (m.status === 'active') await Community.updateOne({ _id: m.community }, { $inc: { memberCount: -1 } });
  notify([m.user], { type: 'moderation', message: `You were removed from ${req.community.name}` });
  res.json({ message: 'Member removed' });
});
