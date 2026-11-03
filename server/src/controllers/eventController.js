const Event = require('../models/Event');
const Membership = require('../models/Membership');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { cleanStr, clampInt } = require('../utils/helpers');
const { notifyCommunity } = require('../utils/notify');

const isMod = (r) => r === 'moderator' || r === 'admin';
const CREATOR = { path: 'creator', select: 'name avatar' };
const COMMUNITY = { path: 'community', select: 'name city' };

const shape = (e, uid) => {
  const o = e.toObject ? e.toObject() : { ...e };
  o.attendeeCount = (o.attendees || []).length;
  o.going = (o.attendees || []).some((a) => String(a) === String(uid));
  delete o.attendees;
  return o;
};

const access = async (req, id) => {
  const event = await Event.findById(id);
  if (!event) throw httpError(404, 'Event not found');
  if (req.user.role === 'admin') return { event, role: 'admin' };
  const m = await Membership.findOne({ user: req.user._id, community: event.community, status: 'active' });
  if (!m) throw httpError(403, 'Join this community to see its events');
  return { event, role: m.role };
};

exports.listByCommunity = asyncHandler(async (req, res) => {
  const past = req.query.past === 'true';
  const filter = { community: req.community._id };
  filter.startsAt = past ? { $lt: new Date() } : { $gte: new Date(Date.now() - 6 * 3600 * 1000) };
  const events = await Event.find(filter).sort({ startsAt: past ? -1 : 1 }).limit(50).populate(CREATOR).populate(COMMUNITY);
  res.json(events.map((e) => ({ ...shape(e, req.user._id), myRole: req.membership.role })));
});

exports.mine = asyncHandler(async (req, res) => {
  const ms = await Membership.find({ user: req.user._id, status: 'active' }).lean();
  const roles = Object.fromEntries(ms.map((m) => [String(m.community), m.role]));
  const events = await Event.find({ community: { $in: ms.map((m) => m.community) }, startsAt: { $gte: new Date(Date.now() - 6 * 3600 * 1000) } })
    .sort({ startsAt: 1 })
    .limit(50)
    .populate(CREATOR)
    .populate(COMMUNITY);
  res.json(events.map((e) => ({ ...shape(e, req.user._id), myRole: roles[String(e.community._id)] })));
});

exports.create = asyncHandler(async (req, res) => {
  const { title, description, location, startsAt, endsAt, coverImage } = req.body;
  if (cleanStr(title, 120).length < 3) throw httpError(400, 'Give the event a title (at least 3 characters)');
  const start = new Date(startsAt);
  if (!startsAt || Number.isNaN(start.getTime())) throw httpError(400, 'Choose a start date and time');
  let end;
  if (endsAt) {
    end = new Date(endsAt);
    if (Number.isNaN(end.getTime()) || end < start) throw httpError(400, 'End time must be after the start time');
  }
  if (req.community.status !== 'approved') throw httpError(400, 'This community is still waiting for platform approval');

  const event = await Event.create({
    community: req.community._id,
    creator: req.user._id,
    title: cleanStr(title, 120),
    description: cleanStr(description, 2000),
    location: cleanStr(location, 200),
    startsAt: start,
    endsAt: end,
    coverImage: typeof coverImage === 'string' && coverImage.startsWith('/uploads/') ? coverImage : undefined,
    attendees: [req.user._id],
  });
  notifyCommunity(req.community._id, req.user._id, {
    type: 'event',
    message: `New event in ${req.community.name}: ${event.title}`,
    link: `/communities/${req.community._id}?tab=events`,
  });
  await event.populate([CREATOR, COMMUNITY]);
  res.status(201).json({ ...shape(event, req.user._id), myRole: req.membership.role });
});

exports.toggleRsvp = asyncHandler(async (req, res) => {
  const { event } = await access(req, req.params.id);
  if (event.status === 'cancelled') throw httpError(400, 'This event was cancelled');
  const going = event.attendees.some((a) => String(a) === String(req.user._id));
  await Event.updateOne({ _id: event._id }, going ? { $pull: { attendees: req.user._id } } : { $addToSet: { attendees: req.user._id } });
  res.json({ going: !going, attendeeCount: event.attendees.length + (going ? -1 : 1) });
});

exports.update = asyncHandler(async (req, res) => {
  const { event, role } = await access(req, req.params.id);
  if (String(event.creator) !== String(req.user._id) && !isMod(role)) throw httpError(403, "You can't edit this event");
  const { title, description, location, startsAt, endsAt, status } = req.body;
  if (title !== undefined) event.title = cleanStr(title, 120);
  if (description !== undefined) event.description = cleanStr(description, 2000);
  if (location !== undefined) event.location = cleanStr(location, 200);
  if (startsAt) { const d = new Date(startsAt); if (!Number.isNaN(d.getTime())) event.startsAt = d; }
  if (endsAt) { const d = new Date(endsAt); if (!Number.isNaN(d.getTime())) event.endsAt = d; }
  if (['active', 'cancelled'].includes(status)) event.status = status;
  await event.save();
  res.json(shape(event, req.user._id));
});

exports.remove = asyncHandler(async (req, res) => {
  const { event, role } = await access(req, req.params.id);
  if (String(event.creator) !== String(req.user._id) && !isMod(role)) throw httpError(403, "You can't delete this event");
  await event.deleteOne();
  res.json({ message: 'Event deleted' });
});
