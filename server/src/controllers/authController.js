const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { cleanStr } = require('../utils/helpers');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const EMAIL = /^\S+@\S+\.\S+$/;

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, hometown = {}, currentCity } = req.body;
  if (typeof name !== 'string' || name.trim().length < 2) throw httpError(400, 'Enter your full name');
  if (typeof email !== 'string' || !EMAIL.test(email)) throw httpError(400, 'Enter a valid email address');
  if (typeof password !== 'string' || password.length < 8) throw httpError(400, 'Password must be at least 8 characters');
  if (await User.exists({ email: email.toLowerCase().trim() })) throw httpError(409, 'An account with this email already exists');

  const user = await User.create({
    name: cleanStr(name, 80),
    email,
    password,
    currentCity: cleanStr(currentCity, 80),
    hometown: { village: cleanStr(hometown.village, 80), city: cleanStr(hometown.city, 80), state: cleanStr(hometown.state, 80) },
  });
  res.status(201).json({ token: sign(user._id), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') throw httpError(400, 'Enter your email and password');
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Email or password is incorrect');
  if (user.isBanned) throw httpError(403, 'This account has been suspended');
  res.json({ token: sign(user._id), user });
});

exports.me = asyncHandler(async (req, res) => res.json({ user: req.user }));

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone, bio, avatar, currentCity, hometown } = req.body;
  const u = req.user;
  if (name !== undefined) {
    if (cleanStr(name, 80).length < 2) throw httpError(400, 'Enter your full name');
    u.name = cleanStr(name, 80);
  }
  if (phone !== undefined) u.phone = cleanStr(phone, 20);
  if (bio !== undefined) u.bio = cleanStr(bio, 300);
  if (currentCity !== undefined) u.currentCity = cleanStr(currentCity, 80);
  if (typeof avatar === 'string' && avatar.startsWith('/uploads/')) u.avatar = avatar;
  if (hometown && typeof hometown === 'object') {
    u.hometown = {
      village: cleanStr(hometown.village, 80),
      city: cleanStr(hometown.city, 80),
      state: cleanStr(hometown.state, 80),
    };
  }
  await u.save();
  res.json({ user: u });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 8) throw httpError(400, 'New password must be at least 8 characters');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) throw httpError(400, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});
