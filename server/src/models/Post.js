const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['post', 'announcement', 'discussion'], default: 'post' },
    title: { type: String, trim: true, maxlength: 150 },
    content: { type: String, required: true, maxlength: 5000 },
    images: [String],
    category: { type: String, trim: true, maxlength: 40 },
    tags: [String],
    pinned: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    isRemoved: { type: Boolean, default: false },
  },
  { timestamps: true }
);
postSchema.index({ community: 1, isRemoved: 1, pinned: -1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
