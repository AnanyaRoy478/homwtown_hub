const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Community = require('../models/Community');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { cleanStr } = require('../utils/helpers');

const MODELS = { post: Post, comment: Comment, user: User, community: Community };

exports.create = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;
  if (!MODELS[targetType]) throw httpError(400, 'Invalid report target');
  if (!cleanStr(reason, 100)) throw httpError(400, 'Choose a reason for the report');
  if (!(await MODELS[targetType].exists({ _id: targetId }))) throw httpError(404, 'The reported item no longer exists');
  const dup = await Report.exists({ reporter: req.user._id, targetType, targetId, status: 'open' });
  if (dup) throw httpError(400, "You've already reported this. We're reviewing it.");
  await Report.create({ reporter: req.user._id, targetType, targetId, reason: cleanStr(reason, 100), details: cleanStr(details, 1000) });
  res.status(201).json({ message: 'Thanks. Our team will review this report.' });
});
