const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['post', 'comment', 'user', 'community'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, maxlength: 100 },
    details: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    resolutionNote: { type: String, maxlength: 500 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
