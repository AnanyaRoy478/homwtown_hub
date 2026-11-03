const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['announcement', 'event', 'comment', 'like', 'join_request', 'join_approved', 'join_rejected', 'community_status', 'moderation', 'system'],
      default: 'system',
    },
    message: { type: String, required: true, maxlength: 300 },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
