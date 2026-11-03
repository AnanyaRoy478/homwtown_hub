const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true, maxlength: 20 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // platform-level role
    hometown: {
      village: { type: String, trim: true, maxlength: 80 },
      city: { type: String, trim: true, maxlength: 80 },
      state: { type: String, trim: true, maxlength: 80 },
    },
    currentCity: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, maxlength: 300 },
    avatar: { type: String },
    isBanned: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
