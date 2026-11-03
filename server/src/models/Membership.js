const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'active' },
  },
  { timestamps: true }
);
membershipSchema.index({ user: 1, community: 1 }, { unique: true });
membershipSchema.index({ community: 1, status: 1, role: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
