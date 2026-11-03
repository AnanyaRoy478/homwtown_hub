const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const RANK = { member: 1, moderator: 2, admin: 3 };

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw httpError(401, 'Please log in to continue');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Your session has expired. Please log in again');
  }
  const user = await User.findById(decoded.id);
  if (!user) throw httpError(401, 'Account not found');
  if (user.isBanned) throw httpError(403, 'This account has been suspended');

  // Track daily activity (throttled to one write per 5 minutes)
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 5 * 60 * 1000) {
    user.lastActiveAt = new Date();
    await User.updateOne({ _id: user._id }, { lastActiveAt: user.lastActiveAt });
  }
  req.user = user;
  next();
});

exports.adminOnly = (req, res, next) =>
  req.user && req.user.role === 'admin' ? next() : next(httpError(403, 'Platform admin access required'));

// Requires an active membership with at least `minRole` in req.params[param].
// Platform admins pass automatically.
exports.memberOf = (minRole = 'member', param = 'communityId') =>
  asyncHandler(async (req, res, next) => {
    const community = await Community.findById(req.params[param]);
    if (!community) throw httpError(404, 'Community not found');
    req.community = community;

    if (req.user.role === 'admin') {
      req.membership = { role: 'admin', status: 'active', platform: true };
      return next();
    }
    const m = await Membership.findOne({ user: req.user._id, community: community._id, status: 'active' });
    if (!m) throw httpError(403, 'Join this community to do that');
    if (RANK[m.role] < RANK[minRole]) throw httpError(403, 'Only community moderators can do that');
    req.membership = m;
    next();
  });

exports.RANK = RANK;
