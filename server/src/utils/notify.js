const Notification = require('../models/Notification');
const Membership = require('../models/Membership');

// Notifications are best-effort: a failure here must never break the main request.
const notify = async (userIds, data) => {
  try {
    const ids = [...new Set(userIds.map(String))];
    if (!ids.length) return;
    await Notification.insertMany(ids.map((user) => ({ user, ...data })));
  } catch (e) {
    console.error('notify failed:', e.message);
  }
};

const notifyCommunity = async (communityId, exceptUserId, data) => {
  const ms = await Membership.find({ community: communityId, status: 'active', user: { $ne: exceptUserId } })
    .select('user')
    .limit(2000)
    .lean();
  return notify(ms.map((m) => m.user), data);
};

const notifyStaff = async (communityId, exceptUserId, data) => {
  const ms = await Membership.find({
    community: communityId,
    status: 'active',
    role: { $in: ['moderator', 'admin'] },
    user: { $ne: exceptUserId },
  })
    .select('user')
    .lean();
  return notify(ms.map((m) => m.user), data);
};

module.exports = { notify, notifyCommunity, notifyStaff };
